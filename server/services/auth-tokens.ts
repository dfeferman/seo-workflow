import crypto from 'crypto'
import jwt from 'jsonwebtoken'

function getSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return secret
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, getSecret(), { expiresIn: '15m', algorithm: 'HS256' })
}

export function verifyAccessToken(token: string): { userId: string } {
  try {
    const payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] }) as { userId?: string }
    if (typeof payload.userId !== 'string') {
      throw new Error('Invalid token payload')
    }
    return { userId: payload.userId }
  } catch {
    throw new Error('Invalid or expired token')
  }
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  if (!token) throw new Error('token must not be empty')
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000   // 7 Tage
export const RESET_TOKEN_TTL_MS   = 60 * 60 * 1000             // 1 Stunde

export function refreshTokenExpiry(now = Date.now()): Date {
  return new Date(now + REFRESH_TOKEN_TTL_MS)
}

export function resetTokenExpiry(now = Date.now()): Date {
  return new Date(now + RESET_TOKEN_TTL_MS)
}
