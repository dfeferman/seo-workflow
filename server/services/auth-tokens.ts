// server/services/auth-tokens.ts
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

export function signAccessToken(userId: string): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return jwt.sign({ userId }, secret, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): { userId: string } {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return jwt.verify(token, secret) as { userId: string }
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000   // 7 Tage
export const RESET_TOKEN_TTL_MS   = 60 * 60 * 1000             // 1 Stunde

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
}

export function resetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS)
}
