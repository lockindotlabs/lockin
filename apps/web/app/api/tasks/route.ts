import { z } from "zod"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  order: z.number().int().optional(),
})

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const planId = url.searchParams.get("planId")
    const status = url.searchParams.get("status")
    const priority = url.searchParams.get("priority")

    if (planId) {
      const steps = await prisma.planStep.findMany({
        where: {
          userId: user.id,
          planId: planId,
          ...(status ? { status: status as never } : {}),
        },
        orderBy: { order: "asc" },
      })

      const mapped = steps.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.status,
        priority: "MEDIUM",
        dueDate: s.dueDate,
        durationMinutes: s.estimatedMinutes,
        order: s.order,
        planId: s.planId,
        userId: s.userId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))

      return Response.json({ success: true, data: mapped })
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        ...(status ? { status: status as never } : {}),
        ...(priority ? { priority: priority as never } : {}),
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    })

    return Response.json({ success: true, data: tasks })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const parsed = CreateTaskSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { message: parsed.error.message, code: 400 } },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: { userId: user.id, ...parsed.data },
    })

    return Response.json({ success: true, message: "Task created", data: task }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
