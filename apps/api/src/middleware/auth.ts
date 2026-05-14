import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt.js'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' })
    return
  }

  const token = header.slice(7)
  const payload = verifyAccessToken(token)
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.user = payload
  next()
}
