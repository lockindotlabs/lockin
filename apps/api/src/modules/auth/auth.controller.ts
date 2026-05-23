import type { Request, Response } from 'express'
import { randomBytes } from 'crypto'
import { BaseController } from '../../controllers/BaseController.js'
import prisma from '../../lib/prisma.js'

export class AuthController extends BaseController {
  async createToken(req: Request, res: Response): Promise<void> {
    try {
      const name = (req.body?.name as string) || 'Extension'
      const token = randomBytes(32).toString('hex')

      const record = await prisma.extensionToken.create({
        data: { userId: req.dbUser.id, token, name },
      })

      // Plaintext token returned only on creation — never retrievable again
      this.handleSuccess(res, { id: record.id, name: record.name, token, createdAt: record.createdAt }, 'Token created', 201)
    } catch (error) {
      this.handleError(error, res, 'createToken')
    }
  }

  async listTokens(req: Request, res: Response): Promise<void> {
    try {
      const tokens = await prisma.extensionToken.findMany({
        where: { userId: req.dbUser.id },
        select: { id: true, name: true, createdAt: true, lastUsedAt: true },
        orderBy: { createdAt: 'desc' },
      })
      this.handleSuccess(res, tokens)
    } catch (error) {
      this.handleError(error, res, 'listTokens')
    }
  }

  async deleteToken(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const existing = await prisma.extensionToken.findFirst({
        where: { id, userId: req.dbUser.id },
      })
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Token not found', code: 404 } })
        return
      }
      await prisma.extensionToken.delete({ where: { id } })
      res.status(204).send()
    } catch (error) {
      this.handleError(error, res, 'deleteToken')
    }
  }
}
