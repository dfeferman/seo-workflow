import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../index.js'
import { pool } from '../db.js'
import bcrypt from 'bcrypt'
import { generateOpaqueToken, hashToken, resetTokenExpiry } from '../services/auth-tokens.js'

const TEST_EMAIL = 'test-auth@example.com'
const TEST_PW = 'password123'

beforeAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL])
  const hash = await bcrypt.hash(TEST_PW, 10)
  await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2)`,
    [TEST_EMAIL, hash]
  )
})

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL])
  await pool.end()
})

describe('POST /api/auth/register', () => {
  const REGISTER_EMAIL = `test-register-${Date.now()}@example.com`

  it('creates a user, returns access token and sets refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: REGISTER_EMAIL, password: TEST_PW })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(REGISTER_EMAIL)
    expect(res.headers['set-cookie']).toBeDefined()
    const cookie: string = res.headers['set-cookie'][0]
    expect(cookie).toContain('refresh_token=')
    expect(cookie).toContain('HttpOnly')
    // cleanup
    await pool.query(`DELETE FROM users WHERE email = $1`, [REGISTER_EMAIL])
  })

  it('returns 409 for duplicate email (existing user)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/auth/login', () => {
  it('returns access token and sets refresh cookie for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns user for valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    const token = loginRes.body.token

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe(TEST_EMAIL)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/refresh', () => {
  it('returns new access token with valid cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    const cookie: string = loginRes.headers['set-cookie'][0].split(';')[0] // "refresh_token=xxx"

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(TEST_EMAIL)
  })

  it('returns 401 with no cookie', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(401)
  })

  it('rotates the refresh token (old token becomes invalid)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    const oldCookie: string = loginRes.headers['set-cookie'][0].split(';')[0]

    // First refresh
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie)
    expect(refreshRes.status).toBe(200)

    // Old cookie must now be invalid
    const retryRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie)
    expect(retryRes.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('invalidates the refresh token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    const cookie: string = loginRes.headers['set-cookie'][0].split(';')[0]

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
    expect(logoutRes.status).toBe(204)

    // Token must now be invalid
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
    expect(refreshRes.status).toBe(401)
  })
})

describe('POST /api/auth/forgot-password', () => {
  it('returns generic success for known email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: TEST_EMAIL })
    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
  })

  it('returns same generic response for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@example.com' })
    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
  })
})

describe('POST /api/auth/reset-password', () => {
  async function createResetToken(): Promise<string> {
    const userRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [TEST_EMAIL])
    const userId = userRes.rows[0].id
    const rawToken = generateOpaqueToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = resetTokenExpiry()
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    )
    return rawToken
  }

  async function restorePassword(): Promise<void> {
    const hash = await bcrypt.hash(TEST_PW, 10)
    await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hash, TEST_EMAIL])
  }

  it('resets password with valid token', async () => {
    const token = await createResetToken()
    try {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'newpassword99' })
      expect(res.status).toBe(200)
      expect(res.body.message).toBeDefined()

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: 'newpassword99' })
      expect(loginRes.status).toBe(200)
    } finally {
      await restorePassword()
    }
  })

  it('returns 400 for already-used token', async () => {
    const token = await createResetToken()
    try {
      await request(app).post('/api/auth/reset-password').send({ token, password: 'somepassword1' })
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'anotherpass2' })
      expect(res.status).toBe(400)
    } finally {
      await restorePassword()
    }
  })

  it('returns 400 for invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'completely-invalid-token', password: 'newpassword99' })
    expect(res.status).toBe(400)
  })

  it('invalidates all existing sessions after password reset', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    const refreshCookie: string = loginRes.headers['set-cookie'][0].split(';')[0]

    const token = await createResetToken()
    try {
      await request(app).post('/api/auth/reset-password').send({ token, password: 'newpassword99' })
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie)
      expect(refreshRes.status).toBe(401)
    } finally {
      await restorePassword()
    }
  })
})
