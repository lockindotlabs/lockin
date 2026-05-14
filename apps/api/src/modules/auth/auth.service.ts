import bcrypt from 'bcrypt'
import prisma from '../../lib/prisma.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js'
import type { RegisterInput, LoginInput } from './auth.schema.js'

const SALT_ROUNDS = 12
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('EMAIL_TAKEN')

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  })

  const accessToken = signAccessToken(user.id)
  const refreshToken = await createRefreshToken(user.id)

  return { user, accessToken, refreshToken }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) throw new Error('INVALID_CREDENTIALS')

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  const accessToken = signAccessToken(user.id)
  const refreshToken = await createRefreshToken(user.id)

  return {
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
    accessToken,
    refreshToken,
  }
}

export async function refresh(token: string) {
  const payload = verifyRefreshToken(token)
  if (!payload) throw new Error('INVALID_TOKEN')

  const stored = await prisma.refreshToken.findUnique({ where: { token } })
  if (!stored || stored.expiresAt < new Date()) throw new Error('INVALID_TOKEN')

  await prisma.refreshToken.delete({ where: { token } })
  const newRefreshToken = await createRefreshToken(payload.userId)
  const accessToken = signAccessToken(payload.userId)

  return { accessToken, refreshToken: newRefreshToken }
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } })
}

export async function getMe(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  })
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = signRefreshToken(userId)
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  })
  return token
}
