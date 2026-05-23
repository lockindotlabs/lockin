import type { Request, Response } from 'express'
import { z } from 'zod'
import { BaseController } from '../../controllers/BaseController.js'
import prisma from '../../lib/prisma.js'

const StartSessionSchema = z.object({
  planId: z.string().min(1),
})

export class FocusSessionController extends BaseController {
  async listSessions(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.query
      const sessions = await prisma.focusSession.findMany({
        where: {
          userId: req.dbUser.id,
          ...(planId ? { planId: String(planId) } : {}),
        },
        include: { plan: { select: { id: true, name: true } } },
        orderBy: { startedAt: 'desc' },
      })
      this.handleSuccess(res, sessions)
    } catch (error) {
      this.handleError(error, res, 'listSessions')
    }
  }

  async startSession(req: Request, res: Response): Promise<void> {
    try {
      const parsed = StartSessionSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }

      // Verify plan belongs to user
      const plan = await prisma.plan.findFirst({
        where: { id: parsed.data.planId, userId: req.dbUser.id },
      })
      if (!plan) {
        res.status(404).json({ success: false, error: { message: 'Plan not found', code: 404 } })
        return
      }

      const session = await prisma.focusSession.create({
        data: { userId: req.dbUser.id, planId: parsed.data.planId },
        include: { plan: { select: { id: true, name: true } } },
      })
      this.handleSuccess(res, session, 'Focus session started', 201)
    } catch (error) {
      this.handleError(error, res, 'startSession')
    }
  }

  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const existing = await prisma.focusSession.findFirst({
        where: { id, userId: req.dbUser.id },
      })
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Session not found', code: 404 } })
        return
      }
      if (existing.endedAt) {
        res.status(400).json({ success: false, error: { message: 'Session already ended', code: 400 } })
        return
      }

      const endedAt = new Date()
      const duration = Math.round((endedAt.getTime() - existing.startedAt.getTime()) / 1000)

      const session = await prisma.focusSession.update({
        where: { id },
        data: { endedAt, duration },
        include: { plan: { select: { id: true, name: true } } },
      })
      this.handleSuccess(res, session)
    } catch (error) {
      this.handleError(error, res, 'endSession')
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const session = await prisma.focusSession.findFirst({
        where: { id, userId: req.dbUser.id },
        include: { plan: { select: { id: true, name: true } } },
      })
      if (!session) {
        res.status(404).json({ success: false, error: { message: 'Session not found', code: 404 } })
        return
      }
      this.handleSuccess(res, session)
    } catch (error) {
      this.handleError(error, res, 'getSession')
    }
  }
}
