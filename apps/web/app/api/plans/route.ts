import { z } from "zod"

import { getAuthenticatedUser } from "@/lib/server/auth"
import {
  listOwnedPlans,
  serializePlan,
  serializePlanSummary,
  upsertOwnedPlan,
} from "@/lib/server/plan-store"

import prisma from "@workspace/db"
import { getEffectiveTier } from "@/lib/billing/catalog"
import { checkPlanCap } from "@/lib/ai/enforcement"
import { getTemplateAccessForUser } from "@/lib/server/template-market-store"

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
  templateId: z.string().nullable().optional(),
  rubricNotes: z.string().nullable().optional(),
  draftReference: z.string().nullable().optional(),
  experienceLevel: z.enum(["FIRST_TIME", "EXPERIENCED"]).nullable().optional(),
})

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const plans = await listOwnedPlans(user.id)

  return Response.json({
    plans: plans.map(serializePlanSummary),
  })
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req)

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = PlanSchema.safeParse(await req.json())

  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  const tier = getEffectiveTier(user.planTier, user.planExpiresAt)

  const planCapCheck = await checkPlanCap({
    prisma,
    userId: user.id,
    tier,
    source: parsed.data.source,
    planId: parsed.data.id,
  })

  if (!planCapCheck.allowed) {
    return Response.json(planCapCheck.error, { status: 403 })
  }

  if (parsed.data.templateId) {
    const access = await getTemplateAccessForUser({
      userId: user.id,
      templateId: parsed.data.templateId,
      tier,
    })

    if (!access || access.locked) {
      return Response.json(
        {
          code: "TEMPLATE_REQUIRES_UPGRADE",
          requiredTier: access?.requiredTier ?? "PLUS",
          upgradeUrl: "/app/billing",
          message: access?.lockReason ?? "This template requires a higher tier plan.",
        },
        { status: 403 }
      )
    }
  }

  const plan = await upsertOwnedPlan(user.id, parsed.data)

  if (!plan) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(serializePlan(plan), { status: 201 })
}
