import prisma from "@workspace/db"

const PLAN_VERSION = 1

type StoredPlanStep = {
  id: string
  title: string
  description: string | null
  dueDate: Date | null
  estimatedMinutes: number
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED"
}

type StoredPlan = {
  id: string
  name: string
  description: string | null
  completion: string | null
  source: "MANUAL" | "AI"
  aiMode: "MANUAL" | "ASSISTED"
  breakdownIntensity: "LOW_ENERGY" | "NORMAL" | "HIGH_ENERGY"
  createdAt: Date
  updatedAt: Date
  steps: StoredPlanStep[]
}

export type PlanStepInput = {
  id: string
  title: string
  description: string
  dueDate: string
  durationMinutes: number
  isCompleted: boolean
}

export type PlanInput = {
  id: string
  title: string
  description: string
  completion: string
  tasks: PlanStepInput[]
  createdAt?: string
  updatedAt?: string
  source?: "MANUAL" | "AI"
  aiMode?: "MANUAL" | "ASSISTED"
  breakdownIntensity?: "LOW_ENERGY" | "NORMAL" | "HIGH_ENERGY"
}

function toDate(value: string | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDateOnly(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : ""
}

function sumEstimatedMinutes(steps: PlanStepInput[]) {
  return steps.reduce((total, step) => total + step.durationMinutes, 0)
}

export function serializePlan(plan: StoredPlan) {
  return {
    id: plan.id,
    title: plan.name,
    description: plan.description ?? "",
    completion: plan.completion ?? "",
    tasks: plan.steps.map((step) => ({
      id: step.id,
      title: step.title,
      description: step.description ?? "",
      dueDate: toDateOnly(step.dueDate),
      durationMinutes: step.estimatedMinutes,
      isCompleted: step.status === "DONE",
    })),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    version: PLAN_VERSION,
    source: plan.source,
    aiMode: plan.aiMode,
    breakdownIntensity: plan.breakdownIntensity,
  }
}

export function serializePlanSummary(plan: {
  id: string
  name: string
  updatedAt: Date
  _count: { steps: number }
}) {
  return {
    id: plan.id,
    title: plan.name,
    taskCount: plan._count.steps,
    updatedAt: plan.updatedAt.toISOString(),
  }
}

export async function getOwnedPlan(userId: string, id: string) {
  return prisma.plan.findFirst({
    where: { id, userId, deletedAt: null },
    include: { steps: { orderBy: { order: "asc" } } },
  })
}

export async function listOwnedPlans(userId: string) {
  return prisma.plan.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { _count: { select: { steps: true } } },
  })
}

export async function upsertOwnedPlan(userId: string, input: PlanInput) {
  const existing = await prisma.plan.findUnique({
    where: { id: input.id },
    select: { userId: true },
  })

  if (existing && existing.userId !== userId) {
    return null
  }

  const totalEstimatedMinutes = sumEstimatedMinutes(input.tasks)
  const steps = input.tasks.map((step, order) => ({
    id: step.id,
    userId,
    title: step.title,
    description: step.description || null,
    status: step.isCompleted ? ("DONE" as const) : ("TODO" as const),
    dueDate: toDate(step.dueDate),
    estimatedMinutes: step.durationMinutes,
    order,
  }))

  return prisma.$transaction(async (tx) => {
    const plan = existing
      ? await tx.plan.update({
          where: { id: input.id },
          data: {
            name: input.title,
            description: input.description || null,
            completion: input.completion || null,
            totalEstimatedMinutes,
            ...(input.source ? { source: input.source } : {}),
            ...(input.aiMode ? { aiMode: input.aiMode } : {}),
            ...(input.breakdownIntensity
              ? { breakdownIntensity: input.breakdownIntensity }
              : {}),
            deletedAt: null,
          },
        })
      : await tx.plan.create({
          data: {
            id: input.id,
            userId,
            name: input.title,
            description: input.description || null,
            completion: input.completion || null,
            totalEstimatedMinutes,
            source: input.source ?? "MANUAL",
            aiMode: input.aiMode ?? "MANUAL",
            breakdownIntensity: input.breakdownIntensity ?? "NORMAL",
          },
        })

    await tx.planStep.deleteMany({ where: { planId: plan.id } })

    if (steps.length > 0) {
      await tx.planStep.createMany({
        data: steps.map((step) => ({ ...step, planId: plan.id })),
      })
    }

    return tx.plan.findFirstOrThrow({
      where: { id: plan.id, userId, deletedAt: null },
      include: { steps: { orderBy: { order: "asc" } } },
    })
  })
}

export async function updateOwnedPlan(
  userId: string,
  id: string,
  input: Omit<PlanInput, "id">
) {
  const existing = await getOwnedPlan(userId, id)

  if (!existing) {
    return null
  }

  return upsertOwnedPlan(userId, { ...input, id })
}

export async function softDeleteOwnedPlan(userId: string, id: string) {
  const existing = await getOwnedPlan(userId, id)

  if (!existing) {
    return false
  }

  await prisma.plan.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return true
}
