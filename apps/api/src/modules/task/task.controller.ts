import type { Request, Response } from 'express'
import { z } from 'zod'
import { BaseController } from '../../controllers/BaseController.js'
import prisma from '../../lib/prisma.js'

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  order: z.number().int().optional(),
})

const UpdateTaskSchema = CreateTaskSchema.partial()

const ReorderSchema = z.object({
  tasks: z.array(z.object({ id: z.string(), order: z.number().int() })).min(1),
})

export class TaskController extends BaseController {
  async listTasks(req: Request, res: Response): Promise<void> {
    try {
      const { status, priority, planId } = req.query

      // If planId provided, return PlanSteps mapped as tasks (Task no longer has planId)
      if (planId) {
        const steps = await prisma.planStep.findMany({
          where: {
            userId: req.dbUser.id,
            planId: String(planId),
            ...(status ? { status: String(status) as never } : {}),
          },
          orderBy: { order: 'asc' },
        })
        // Map PlanStep → Task-compatible shape the extension expects
        const mapped = steps.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description,
          status: s.status,
          priority: 'MEDIUM',
          dueDate: s.dueDate,
          durationMinutes: s.estimatedMinutes,
          order: s.order,
          planId: s.planId,
          userId: s.userId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }))
        this.handleSuccess(res, mapped)
        return
      }

      const tasks = await prisma.task.findMany({
        where: {
          userId: req.dbUser.id,
          ...(status ? { status: String(status) as never } : {}),
          ...(priority ? { priority: String(priority) as never } : {}),
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      })
      this.handleSuccess(res, tasks)
    } catch (error) {
      this.handleError(error, res, 'listTasks')
    }
  }

  async getTask(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const task = await prisma.task.findFirst({
        where: { id, userId: req.dbUser.id },
      })
      if (!task) {
        res.status(404).json({ success: false, error: { message: 'Task not found', code: 404 } })
        return
      }
      this.handleSuccess(res, task)
    } catch (error) {
      this.handleError(error, res, 'getTask')
    }
  }

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CreateTaskSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }

      const task = await prisma.task.create({
        data: { userId: req.dbUser.id, ...parsed.data },
      })
      this.handleSuccess(res, task, 'Task created', 201)
    } catch (error) {
      this.handleError(error, res, 'createTask')
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const parsed = UpdateTaskSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }

      const existing = await prisma.task.findFirst({
        where: { id, userId: req.dbUser.id },
      })
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Task not found', code: 404 } })
        return
      }

      const task = await prisma.task.update({
        where: { id },
        data: parsed.data,
      })
      this.handleSuccess(res, task)
    } catch (error) {
      this.handleError(error, res, 'updateTask')
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const existing = await prisma.task.findFirst({
        where: { id, userId: req.dbUser.id },
      })
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Task not found', code: 404 } })
        return
      }

      await prisma.task.delete({ where: { id } })
      res.status(204).send()
    } catch (error) {
      this.handleError(error, res, 'deleteTask')
    }
  }

  async reorderTasks(req: Request, res: Response): Promise<void> {
    try {
      const parsed = ReorderSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }

      // Verify all tasks belong to the user before updating
      const ids = parsed.data.tasks.map((t) => t.id)
      const owned = await prisma.task.findMany({
        where: { id: { in: ids }, userId: req.dbUser.id },
        select: { id: true },
      })
      if (owned.length !== ids.length) {
        res.status(403).json({ success: false, error: { message: 'One or more tasks not found', code: 403 } })
        return
      }

      await prisma.$transaction(
        parsed.data.tasks.map(({ id, order }) =>
          prisma.task.update({ where: { id }, data: { order } }),
        ),
      )

      this.handleSuccess(res, null, 'Tasks reordered')
    } catch (error) {
      this.handleError(error, res, 'reorderTasks')
    }
  }
}
