import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcrypt'
import { app } from '../index.js'
import { pool } from '../db.js'
import {
  generateOpaqueToken,
  hashToken,
  refreshTokenExpiry,
  resetTokenExpiry,
} from '../services/auth-tokens.js'

const SUPERADMIN_EMAIL = 'superadmin@example.com'
const APPROVED_EMAIL = 'approved-user@example.com'
const PENDING_EMAIL = 'pending-user@example.com'
const TEST_PW = 'password123'

async function ensureUserApprovalColumns(): Promise<void> {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL
  `)
}

async function createUser(email: string, options: { is_superadmin?: boolean; is_approved?: boolean } = {}) {
  const passwordHash = await bcrypt.hash(TEST_PW, 10)
  const isSuperadmin = options.is_superadmin ?? false
  const isApproved = options.is_approved ?? false
  const approvedAt = isApproved ? new Date() : null

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, is_superadmin, is_approved, approved_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [email, passwordHash, isSuperadmin, isApproved, approvedAt]
  )

  return result.rows[0].id as string
}

async function seedBaseUsers(): Promise<void> {
  await pool.query(`DELETE FROM users WHERE email = ANY($1::text[])`, [[SUPERADMIN_EMAIL, APPROVED_EMAIL, PENDING_EMAIL]])
  await createUser(SUPERADMIN_EMAIL, { is_superadmin: true, is_approved: true })
  await createUser(APPROVED_EMAIL, { is_approved: true })
  await createUser(PENDING_EMAIL, { is_approved: false })
}

type UserApprovalSnapshot = {
  id: string
  is_superadmin: boolean
  is_approved: boolean
  approved_at: Date | null
}

async function captureUserApprovalState(): Promise<UserApprovalSnapshot[]> {
  const result = await pool.query<UserApprovalSnapshot>(
    `SELECT id, is_superadmin, is_approved, approved_at FROM users`
  )
  return result.rows
}

async function restoreUserApprovalState(snapshot: UserApprovalSnapshot[]): Promise<void> {
  for (const row of snapshot) {
    await pool.query(
      `UPDATE users
       SET is_superadmin = $2,
           is_approved = $3,
           approved_at = $4
       WHERE id = $1`,
      [row.id, row.is_superadmin, row.is_approved, row.approved_at]
    )
  }
}

beforeAll(async () => {
  await ensureUserApprovalColumns()
  await seedBaseUsers()
})

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = ANY($1::text[])`, [[SUPERADMIN_EMAIL, APPROVED_EMAIL, PENDING_EMAIL]])
  await pool.end()
})

describe('POST /api/auth/register', () => {
  const REGISTER_EMAIL = `test-register-${Date.now()}@example.com`

  it('creates a pending user without token and cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: REGISTER_EMAIL, password: TEST_PW })

    expect(res.status).toBe(201)
    expect(res.body.message).toContain('Freigabe')
    expect(res.body.token).toBeUndefined()
    expect(res.headers['set-cookie']).toBeUndefined()

    const userRes = await pool.query(`SELECT is_approved FROM users WHERE email = $1`, [REGISTER_EMAIL])
    expect(userRes.rows[0].is_approved).toBe(false)

    await pool.query(`DELETE FROM users WHERE email = $1`, [REGISTER_EMAIL])
  })

  it('returns 409 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: APPROVED_EMAIL, password: TEST_PW })

    expect(res.status).toBe(409)
  })

  it('bootstraps the first account as approved superadmin', async () => {
    const FIRST_EMAIL = `first-admin-${Date.now()}@example.com`
    const snapshot = await captureUserApprovalState()
    try {
      await pool.query(`DELETE FROM refresh_tokens`)
      await pool.query(`UPDATE users SET is_superadmin = FALSE, is_approved = FALSE, approved_at = NULL`)
      await pool.query(`DELETE FROM users WHERE email = ANY($1::text[])`, [[SUPERADMIN_EMAIL, APPROVED_EMAIL, PENDING_EMAIL]])

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: FIRST_EMAIL, password: TEST_PW })

      expect(res.status).toBe(201)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.is_superadmin).toBe(true)
      expect(res.body.user.is_approved).toBe(true)
    } finally {
      await pool.query(`DELETE FROM users WHERE email = $1`, [FIRST_EMAIL])
      await restoreUserApprovalState(snapshot)
      await seedBaseUsers()
    }
  })
})

describe('POST /api/auth/login', () => {
  it('returns access token and refresh cookie for approved users', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: APPROVED_EMAIL, password: TEST_PW })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(APPROVED_EMAIL)
    expect(res.body.user.is_approved).toBe(true)
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('returns 403 for pending users', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: PENDING_EMAIL, password: TEST_PW })

    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Freigabe')
  })

  it('bootstraps the oldest user on login if no superadmin exists', async () => {
    const DEADLOCK_EMAIL = `bootstrap-login-${Date.now()}@example.com`
    const snapshot = await captureUserApprovalState()
    try {
      await pool.query(`DELETE FROM refresh_tokens`)
      await pool.query(`UPDATE users SET is_superadmin = FALSE, is_approved = FALSE, approved_at = NULL`)
      await pool.query(`DELETE FROM users WHERE email = ANY($1::text[])`, [[SUPERADMIN_EMAIL, APPROVED_EMAIL, PENDING_EMAIL]])
      await createUser(DEADLOCK_EMAIL, { is_superadmin: false, is_approved: false })

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: DEADLOCK_EMAIL, password: TEST_PW })

      expect(res.status).toBe(200)
      expect(res.body.user.is_superadmin).toBe(true)
      expect(res.body.user.is_approved).toBe(true)
    } finally {
      await pool.query(`DELETE FROM users WHERE email = $1`, [DEADLOCK_EMAIL])
      await restoreUserApprovalState(snapshot)
      await seedBaseUsers()
    }
  })
})

describe('GET /api/auth/me', () => {
  it('returns user flags for a valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: APPROVED_EMAIL, password: TEST_PW })

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe(APPROVED_EMAIL)
    expect(res.body.is_superadmin).toBe(false)
    expect(res.body.is_approved).toBe(true)
  })
})

describe('POST /api/auth/refresh', () => {
  it('returns a new access token for approved users', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: APPROVED_EMAIL, password: TEST_PW })
    const cookie: string = loginRes.headers['set-cookie'][0].split(';')[0]

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.is_approved).toBe(true)
  })

  it('rejects refresh tokens for users who are no longer approved', async () => {
    const userRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [PENDING_EMAIL])
    const userId = userRes.rows[0].id as string
    const rawToken = generateOpaqueToken()
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, hashToken(rawToken), refreshTokenExpiry()]
    )

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${rawToken}`)

    expect(res.status).toBe(403)
  })
})

describe('POST /api/auth/forgot-password', () => {
  it('returns generic success for known email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: APPROVED_EMAIL })

    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
  })
})

describe('POST /api/auth/reset-password', () => {
  async function createResetToken(): Promise<string> {
    const userRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [APPROVED_EMAIL])
    const userId = userRes.rows[0].id
    const rawToken = generateOpaqueToken()
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, hashToken(rawToken), resetTokenExpiry()]
    )
    return rawToken
  }

  async function restorePassword(): Promise<void> {
    const hash = await bcrypt.hash(TEST_PW, 10)
    await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hash, APPROVED_EMAIL])
  }

  it('resets password with valid token', async () => {
    const token = await createResetToken()
    try {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'newpassword99' })

      expect(res.status).toBe(200)

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: APPROVED_EMAIL, password: 'newpassword99' })

      expect(loginRes.status).toBe(200)
    } finally {
      await restorePassword()
    }
  })
})

describe('Admin user management', () => {
  async function loginAs(email: string) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: TEST_PW })
    return res.body.token as string
  }

  it('allows superadmin to list users', async () => {
    const token = await loginAs(SUPERADMIN_EMAIL)

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.some((row: { email: string }) => row.email === PENDING_EMAIL)).toBe(true)
  })

  it('blocks non-superadmin access', async () => {
    const token = await loginAs(APPROVED_EMAIL)

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('approves and revokes users', async () => {
    const token = await loginAs(SUPERADMIN_EMAIL)
    const userRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [PENDING_EMAIL])
    const pendingId = userRes.rows[0].id as string

    const approveRes = await request(app)
      .post(`/api/admin/users/${pendingId}/approve`)
      .set('Authorization', `Bearer ${token}`)

    expect(approveRes.status).toBe(200)
    expect(approveRes.body.is_approved).toBe(true)

    const loginApproved = await request(app)
      .post('/api/auth/login')
      .send({ email: PENDING_EMAIL, password: TEST_PW })
    expect(loginApproved.status).toBe(200)

    const revokeRes = await request(app)
      .post(`/api/admin/users/${pendingId}/revoke`)
      .set('Authorization', `Bearer ${token}`)

    expect(revokeRes.status).toBe(200)
    expect(revokeRes.body.is_approved).toBe(false)

    const loginRevoked = await request(app)
      .post('/api/auth/login')
      .send({ email: PENDING_EMAIL, password: TEST_PW })
    expect(loginRevoked.status).toBe(403)
  })

  it('sets a user password and invalidates existing sessions', async () => {
    const token = await loginAs(SUPERADMIN_EMAIL)

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: APPROVED_EMAIL, password: TEST_PW })
    const cookie: string = loginRes.headers['set-cookie'][0].split(';')[0]

    const userRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [APPROVED_EMAIL])
    const approvedId = userRes.rows[0].id as string

    const setPasswordRes = await request(app)
      .post(`/api/admin/users/${approvedId}/set-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'changed-password-77' })

    expect(setPasswordRes.status).toBe(200)

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: APPROVED_EMAIL, password: TEST_PW })
    expect(oldLogin.status).toBe(401)

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
    expect(refreshRes.status).toBe(401)

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: APPROVED_EMAIL, password: 'changed-password-77' })
    expect(newLogin.status).toBe(200)

    const restoreHash = await bcrypt.hash(TEST_PW, 10)
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [restoreHash, approvedId])
  })

  it('deletes a non-superadmin user', async () => {
    const token = await loginAs(SUPERADMIN_EMAIL)
    const deleteEmail = `delete-me-${Date.now()}@example.com`
    const deleteId = await createUser(deleteEmail, { is_approved: true })

    const res = await request(app)
      .delete(`/api/admin/users/${deleteId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)

    const deleted = await pool.query(`SELECT id FROM users WHERE id = $1`, [deleteId])
    expect(deleted.rows).toHaveLength(0)
  })
})
