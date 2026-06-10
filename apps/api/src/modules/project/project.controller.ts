import type { Request, Response } from 'express'
import { z } from 'zod'
import { BaseController } from '../../controllers/BaseController.js'
import prisma from '../../lib/prisma.js'

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

const UpdateProjectSchema = CreateProjectSchema.partial()

export class ProjectController extends BaseController {
  async listProjects(req: Request, res: Response): Promise<void> {
    try {
      const projects = await prisma.project.findMany({
        where: { userId: req.dbUser.id },
        include: { _count: { select: { plans: true } } },
        orderBy: { createdAt: 'desc' },
      })
      this.handleSuccess(res, projects)
    } catch (error) {
      this.handleError(error, res, 'listProjects')
    }
  }

  async getProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const project = await prisma.project.findFirst({
        where: { id, userId: req.dbUser.id },
        include: { plans: { orderBy: { createdAt: 'desc' } } },
      })
      if (!project) {
        res.status(404).json({ success: false, error: { message: 'Project not found', code: 404 } })
        return
      }
      this.handleSuccess(res, project)
    } catch (error) {
      this.handleError(error, res, 'getProject')
    }
  }

  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CreateProjectSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }
      const project = await prisma.project.create({
        data: { userId: req.dbUser.id, ...parsed.data },
      })
      this.handleSuccess(res, project, 'Project created', 201)
    } catch (error) {
      this.handleError(error, res, 'createProject')
    }
  }

  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const parsed = UpdateProjectSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: parsed.error.message, code: 400 } })
        return
      }
      const existing = await prisma.project.findFirst({ where: { id, userId: req.dbUser.id } })
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Project not found', code: 404 } })
        return
      }
      const project = await prisma.project.update({ where: { id }, data: parsed.data })
      this.handleSuccess(res, project)
    } catch (error) {
      this.handleError(error, res, 'updateProject')
    }
  }

  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const existing = await prisma.project.findFirst({ where: { id, userId: req.dbUser.id } })
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Project not found', code: 404 } })
        return
      }
      await prisma.project.delete({ where: { id } })
      res.status(204).send()
    } catch (error) {
      this.handleError(error, res, 'deleteProject')
    }
  }
}
