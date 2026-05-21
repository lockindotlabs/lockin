import type { Request, Response, NextFunction } from 'express'
import { getAuth } from '@clerk/express'
import prisma from '../lib/prisma.js'

export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Try Clerk JWT first
    const { userId } = getAuth(req)
    if (userId) {
      next()
      return
    }

    // 2. Fall back to extension token (64-char hex, never starts with "eyJ")
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const raw = authHeader.slice(7)
      if (!raw.startsWith('eyJ')) {
        const record = await prisma.extensionToken.findUnique({ where: { token: raw } })
        if (record) {
          req.extensionTokenUserId = record.userId
          prisma.extensionToken.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
          next()
          return
        }
      }
    }

    res.status(401).json({ error: 'Unauthorized' })
  }
}
