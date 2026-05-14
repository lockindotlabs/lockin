import type { Request, Response } from 'express'
import { registerSchema, loginSchema } from './auth.schema.js'
import * as authService from './auth.service.js'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export async function registerHandler(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const { user, accessToken, refreshToken } = await authService.register(parsed.data)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.status(201).json({ user, accessToken })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      res.status(409).json({ error: 'Email already in use' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const { user, accessToken, refreshToken } = await authService.login(parsed.data)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.json({ user, accessToken })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined
  if (!token) {
    res.status(401).json({ error: 'No refresh token' })
    return
  }

  try {
    const { accessToken, refreshToken } = await authService.refresh(token)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
}

export async function logoutHandler(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined
  if (token) await authService.logout(token)
  res.clearCookie('refreshToken')
  res.status(204).send()
}

export async function meHandler(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.userId)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ user })
}
