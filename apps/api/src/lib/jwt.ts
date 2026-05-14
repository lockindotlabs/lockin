import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL ?? '15m'
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL ?? '7d'

export interface TokenPayload {
  userId: string
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_TTL } as jwt.SignOptions)
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_TTL } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload
  } catch {
    return null
  }
}
