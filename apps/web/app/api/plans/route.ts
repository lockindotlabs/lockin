import { z } from "zod"

import { getCurrentDbUser } from "@/lib/server/current-db-user"
import {
  listOwnedPlans,
  serializePlan,
  serializePlanSummary,
  upsertOwnedPlan,
} from "@/lib/server/plan-store"

const PlanStepSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  dueDate: z.string(),
  durationMinutes: z.number().int().positive(),
  isCompleted: z.boolean(),
})

const PlanSchema = z.object({
  id: z.string().min(1),
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
})

export async function GET() {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const plans = await listOwnedPlans(user.id)

  return Response.json({
    plans: plans.map(serializePlanSummary),
  })
}

export async function POST(req: Request) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = PlanSchema.safeParse(await req.json())

  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  const plan = await upsertOwnedPlan(user.id, parsed.data)

  if (!plan) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(serializePlan(plan), { status: 201 })
}
