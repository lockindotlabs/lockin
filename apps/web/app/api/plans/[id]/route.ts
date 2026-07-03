import { z } from "zod"

import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { getAuthenticatedUser } from "@/lib/server/auth"
import {
  getOwnedPlan,
  serializePlan,
  softDeleteOwnedPlan,
  updateOwnedPlan,
} from "@/lib/server/plan-store"

const PlanStepSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  dueDate: z.string(),
  durationMinutes: z.number().int().positive(),
  isCompleted: z.boolean(),
  guidance: z.string().nullable().optional(),
  completionNote: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
})

const UpdatePlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  completion: z.string(),
  tasks: z.array(PlanStepSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  version: z.literal(1).optional(),
  source: z.enum(["MANUAL", "AI"]).optional(),
  aiMode: z.enum(["MANUAL", "ASSISTED"]).optional(),
  breakdownIntensity: z
    .enum(["LOW_ENERGY", "NORMAL", "HIGH_ENERGY"])
    .optional(),
  templateId: z.string().nullable().optional(),
  rubricNotes: z.string().nullable().optional(),
  draftReference: z.string().nullable().optional(),
  experienceLevel: z.enum(["FIRST_TIME", "EXPERIENCED"]).nullable().optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  // The Chrome extension reads plan steps (to mirror the task checklist) via
  // its long-lived ExtensionToken, not a Clerk session — getCurrentDbUser()
  // only recognizes Clerk cookies, so it always 401s for those requests.
  const user = await getAuthenticatedUser(req)

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const plan = await getOwnedPlan(user.id, id)

  if (!plan) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(serializePlan(plan))
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = UpdatePlanSchema.safeParse(await req.json())

  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  const { id } = await context.params
  const plan = await updateOwnedPlan(user.id, id, parsed.data)

  if (!plan) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(serializePlan(plan))
}

export async function DELETE(_req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const deleted = await softDeleteOwnedPlan(user.id, id)

  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
