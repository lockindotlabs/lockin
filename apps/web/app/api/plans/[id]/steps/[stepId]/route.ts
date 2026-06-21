import { z } from "zod"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

const UpdateStepSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
})

type RouteContext = {
  params: Promise<{ id: string; stepId: string }>
}

// Lets the extension persist a single task-check toggle live (popup.js ticks a
// task during a sprint). Previously the extension PATCHed /api/tasks/{id} —
// the wrong model entirely (Task, not PlanStep) — so this write always 404'd
// silently. The CustomEvent bridge (content.js -> session page) still mirrors
// the toggle into the live React UI independent of this endpoint; this route
// is what makes the change durable across reloads / session-end snapshot.
export async function PATCH(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: planId, stepId } = await context.params

    const plan = await prisma.plan.findFirst({ where: { id: planId, userId: user.id } })
    if (!plan) {
      return Response.json({ success: false, error: { message: "Plan not found", code: 404 } }, { status: 404 })
    }

    const parsed = UpdateStepSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { message: parsed.error.message, code: 400 } },
        { status: 400 }
      )
    }

    const result = await prisma.planStep.updateMany({
      where: { id: stepId, planId },
      data: { status: parsed.data.status },
    })

    if (result.count === 0) {
      return Response.json({ success: false, error: { message: "Step not found", code: 404 } }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
