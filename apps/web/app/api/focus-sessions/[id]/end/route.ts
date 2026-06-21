import { z } from "zod"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"
import { pushToUser } from "@/lib/server/sse-registry"

const EndSessionSchema = z.object({
  completionType: z.enum(["EARLY", "NORMAL", "OVERTIME"]),
  actualDuration: z.number().int().nonnegative(),
  overtimeDuration: z.number().int().nonnegative().optional().default(0),
  slipCount: z.number().int().nonnegative().optional().default(0),
  tasksSnapshot: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().optional(),
        title: z.string().optional(),
        done: z.boolean().optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
        durationMinutes: z.number().optional(),
      })
    )
    .optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const existing = await prisma.focusSession.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return Response.json(
        { success: false, error: { message: "Session not found", code: 404 } },
        { status: 404 }
      )
    }

    if (existing.endedAt) {
      return Response.json(
        { success: false, error: { message: "Session already ended", code: 400 } },
        { status: 400 }
      )
    }

    const parsed = EndSessionSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { message: parsed.error.message, code: 400 } },
        { status: 400 }
      )
    }

    const {
      completionType,
      actualDuration,
      overtimeDuration,
      slipCount,
      tasksSnapshot,
    } = parsed.data

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

    if (tasksSnapshot?.length && existing.planId) {
      const planId = existing.planId
      const updateOps = tasksSnapshot
        .filter((t) => t.id)
        .map((t) => {
          const status = t.status ?? (t.done ? "DONE" : "TODO")
          return prisma.planStep.updateMany({
            where: { id: t.id!, planId },
            data: {
              status,
              ...(t.durationMinutes !== undefined
                ? { estimatedMinutes: t.durationMinutes }
                : {}),
            },
          })
        })
      if (updateOps.length) await prisma.$transaction(updateOps)
    }

    pushToUser(user.id, { type: "session-end", data: { id: session.id, completionType: session.completionType } })

    return Response.json({
      success: true,
      data: {
        id: session.id,
        duration: session.duration,
        completionType: session.completionType,
        endedAt: session.endedAt,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
