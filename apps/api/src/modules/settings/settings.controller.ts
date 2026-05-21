import type { Request, Response } from 'express'
import { z } from 'zod'
import { BaseController } from '../../controllers/BaseController.js'
import prisma from '../../lib/prisma.js'

const UpdateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(10).optional(),
})

export class SettingsController extends BaseController {
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.dbUser.id
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: { userId },
      })
      this.handleSuccess(res, settings)
    } catch (error) {
      this.handleError(error, res, 'getSettings')
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const parsed = UpdateSettingsSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }

      const userId = req.dbUser.id
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: parsed.data,
        create: { userId, ...parsed.data },
      })
      this.handleSuccess(res, settings)
    } catch (error) {
      this.handleError(error, res, 'updateSettings')
    }
  }
}
