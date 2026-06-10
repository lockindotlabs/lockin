import type { Request, Response, NextFunction } from 'express'
import { getAuth } from '@clerk/express'
import prisma from '../lib/prisma.js'

export async function syncUser(req: Request, res: Response, next: NextFunction) {
  // Extension token path — userId already resolved by requireAuth()
  if (req.extensionTokenUserId) {
    const user = await prisma.user.findUnique({ where: { id: req.extensionTokenUserId } })
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    req.dbUser = user
    next()
    return
  }

  // Clerk JWT path
  const { userId } = getAuth(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  let user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    user = await prisma.user.create({ data: { id: userId } })
  }
  req.dbUser = user
  next()
}
