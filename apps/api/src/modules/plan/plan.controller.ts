import type { Request, Response } from 'express'
import { z } from 'zod'
import { BaseController } from '../../controllers/BaseController.js'
import prisma from '../../lib/prisma.js'

const CreatePlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  goal: z.string().max(500).optional(),
  completion: z.string().max(1000).optional(),
  projectId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

const UpdatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  goal: z.string().max(500).optional(),
  completion: z.string().max(1000).optional(),
  projectId: z.string().nullable().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export class PlanController extends BaseController {
  async listPlans(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.query
      const plans = await prisma.plan.findMany({
        where: {
          userId: req.dbUser.id,
          ...(projectId ? { projectId: String(projectId) } : {}),
        },
        include: { project: { select: { id: true, name: true, color: true } } },
        orderBy: { createdAt: 'desc' },
      })
      this.handleSuccess(res, plans)
    } catch (error) {
      this.handleError(error, res, 'listPlans')
    }
  }

  async getPlan(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const plan = await prisma.plan.findFirst({
        where: { id, userId: req.dbUser.id },
        include: {
          project: { select: { id: true, name: true, color: true } },
          tasks: { orderBy: { order: 'asc' } },
        },
      })
      if (!plan) {
        res.status(404).json({ success: false, error: { message: 'Plan not found', code: 404 } })
        return
      }
      this.handleSuccess(res, plan)
    } catch (error) {
      this.handleError(error, res, 'getPlan')
    }
  }

  async createPlan(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CreatePlanSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }
      const plan = await prisma.plan.create({
        data: { userId: req.dbUser.id, ...parsed.data },
      })
      this.handleSuccess(res, plan, 'Plan created', 201)
    } catch (error) {
      this.handleError(error, res, 'createPlan')
    }
  }

  async updatePlan(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const parsed = UpdatePlanSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }
      const existing = await prisma.plan.findFirst({ where: { id, userId: req.dbUser.id } })
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Plan not found', code: 404 } })
        return
      }
      const plan = await prisma.plan.update({ where: { id }, data: parsed.data })
      this.handleSuccess(res, plan)
    } catch (error) {
      this.handleError(error, res, 'updatePlan')
    }
  }

  async deletePlan(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const existing = await prisma.plan.findFirst({ where: { id, userId: req.dbUser.id } })
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Plan not found', code: 404 } })
        return
      }
      await prisma.plan.delete({ where: { id } })
      res.status(204).send()
    } catch (error) {
      this.handleError(error, res, 'deletePlan')
    }
  }
}
