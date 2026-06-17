import { z } from "zod"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  order: z.number().int().optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const task = await prisma.task.findFirst({
      where: { id, userId: user.id },
    })

    if (!task) {
      return Response.json(
        { success: false, error: { message: "Task not found", code: 404 } },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: task })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const parsed = UpdateTaskSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { message: parsed.error.message, code: 400 } },
        { status: 400 }
      )
    }

    const { id } = await context.params
    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return Response.json(
        { success: false, error: { message: "Task not found", code: 404 } },
        { status: 404 }
      )
    }

    const task = await prisma.task.update({
      where: { id },
      data: parsed.data,
    })

    return Response.json({ success: true, data: task })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return Response.json(
        { success: false, error: { message: "Task not found", code: 404 } },
        { status: 404 }
      )
    }

    await prisma.task.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
