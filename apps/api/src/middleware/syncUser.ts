import type { Request, Response, NextFunction } from 'express'
import { getAuth } from '@clerk/express'
import prisma from '../lib/prisma.js'

export async function syncUser(req: Request, res: Response, next: NextFunction) {
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
