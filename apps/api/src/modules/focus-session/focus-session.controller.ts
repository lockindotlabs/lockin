import type { Request, Response } from 'express'
import { z } from 'zod'
import { BaseController } from '../../controllers/BaseController.js'
import prisma from '../../lib/prisma.js'

const StartSessionSchema = z.object({
  planId: z.string().min(1).optional(),
  plannedDuration: z.number().int().positive().optional(),
})

const EndSessionSchema = z.object({
  completionType: z.enum(['EARLY', 'NORMAL', 'OVERTIME']),
  actualDuration: z.number().int().nonnegative(),
  overtimeDuration: z.number().int().nonnegative().optional().default(0),
  slipCount: z.number().int().nonnegative().optional().default(0),
  tasksSnapshot: z.array(z.object({
    id: z.string().optional(),
    label: z.string().optional(),
    title: z.string().optional(),
    done: z.boolean().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
    durationMinutes: z.number().optional(),
  })).optional(),
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

      const { planId, plannedDuration } = parsed.data

      if (planId) {
        const plan = await prisma.plan.findFirst({
          where: { id: planId, userId: req.dbUser.id },
        })
        if (!plan) {
          res.status(404).json({ success: false, error: { message: 'Plan not found', code: 404 } })
          return
        }
      }

      const session = await prisma.focusSession.create({
        data: {
          userId: req.dbUser.id,
          ...(planId ? { planId } : {}),
          ...(plannedDuration ? { plannedDuration } : {}),
        },
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

      const parsed = EndSessionSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }

      const { completionType, actualDuration, overtimeDuration, slipCount, tasksSnapshot } = parsed.data

      const session = await prisma.focusSession.update({
        where: { id },
        data: {
          endedAt: new Date(),
          duration: actualDuration,
          overtimeDuration: overtimeDuration ?? 0,
          completionType,
          slipCount: slipCount ?? 0,
          tasksSnapshot: tasksSnapshot ?? [],
        },
        include: { plan: { select: { id: true, name: true } } },
      })

      // Update task statuses from snapshot — only for tasks owned by this plan
      if (tasksSnapshot?.length && existing.planId) {
        const planId = existing.planId
        const updateOps = tasksSnapshot
          .filter(t => t.id)
          .map(t => {
            const status = t.status ?? (t.done ? 'DONE' : 'TODO')
            return prisma.task.updateMany({
              where: { id: t.id! },
              data: { status },
            })
          })
        if (updateOps.length) await prisma.$transaction(updateOps)
      }

      this.handleSuccess(res, {
        id: session.id,
        duration: session.duration,
        completionType: session.completionType,
        endedAt: session.endedAt,
      })
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
