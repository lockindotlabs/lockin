import { z } from "zod"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

const StartSessionSchema = z.object({
  planId: z.string().min(1).optional(),
  plannedDuration: z.number().int().positive().optional(),
})

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const planId = url.searchParams.get("planId")
    const active = url.searchParams.get("active")

    const sessions = await prisma.focusSession.findMany({
      where: {
        userId: user.id,
        ...(planId ? { planId: planId } : {}),
        ...(active === "true" ? { endedAt: null } : {}),
      },
      include: { plan: { select: { id: true, name: true } } },
      orderBy: { startedAt: "desc" },
      ...(active === "true" ? { take: 1 } : {}),
    })

    return Response.json({ success: true, data: sessions })
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
    const parsed = StartSessionSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { message: parsed.error.message, code: 400 } },
        { status: 400 }
      )
    }

    const { planId, plannedDuration } = parsed.data

    if (planId) {
      const plan = await prisma.plan.findFirst({
        where: { id: planId, userId: user.id },
      })
      if (!plan) {
        return Response.json(
          { success: false, error: { message: "Plan not found", code: 404 } },
          { status: 404 }
        )
      }
    }

    const session = await prisma.focusSession.create({
      data: {
        userId: user.id,
        ...(planId ? { planId } : {}),
        ...(plannedDuration ? { plannedDuration } : {}),
      },
      include: { plan: { select: { id: true, name: true } } },
    })

    return Response.json({ success: true, message: "Focus session started", data: session }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
