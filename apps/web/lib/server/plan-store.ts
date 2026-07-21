import prisma from "@workspace/db"

const PLAN_VERSION = 1

type StoredPlanStep = {
  id: string
  title: string
  description: string | null
  dueDate: Date | null
  estimatedMinutes: number
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED"
  guidance: string | null
  completionNote: string | null
  parentId: string | null
}

type StoredPlan = {
  id: string
  name: string
  description: string | null
  completion: string | null
  source: "MANUAL" | "AI"
  aiMode: "MANUAL" | "ASSISTED"
  breakdownIntensity: "LOW_ENERGY" | "NORMAL" | "HIGH_ENERGY"
  templateId: string | null
  rubricNotes: string | null
  draftReference: string | null
  experienceLevel: "FIRST_TIME" | "EXPERIENCED" | null
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
  guidance?: string | null
  parentId?: string | null
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
  templateId?: string | null
  rubricNotes?: string | null
  draftReference?: string | null
  experienceLevel?: "FIRST_TIME" | "EXPERIENCED" | null
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

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  )
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
      guidance: step.guidance ?? null,
      completionNote: step.completionNote ?? null,
      parentId: step.parentId ?? null,
    })),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    version: PLAN_VERSION,
    source: plan.source,
    aiMode: plan.aiMode,
    breakdownIntensity: plan.breakdownIntensity,
    templateId: plan.templateId ?? null,
    rubricNotes: plan.rubricNotes ?? null,
    draftReference: plan.draftReference ?? null,
    experienceLevel: plan.experienceLevel ?? null,
  }
}

export function serializePlanSummary(plan: {
  id: string
  name: string
  updatedAt: Date
  steps: {
    id: string
    status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED"
    dueDate: Date | null
  }[]
}) {
  return {
    id: plan.id,
    title: plan.name,
    taskCount: plan.steps.length,
    updatedAt: plan.updatedAt.toISOString(),
    steps: plan.steps.map((step) => ({
      id: step.id,
      isCompleted: step.status === "DONE" || step.status === "CANCELLED",
      dueDate: step.dueDate ? step.dueDate.toISOString() : null,
    })),
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
    include: { steps: { select: { id: true, status: true, dueDate: true } } },
  })
}

export async function upsertOwnedPlan(userId: string, input: PlanInput) {
  const totalEstimatedMinutes = sumEstimatedMinutes(input.tasks)
  const taskIds = new Set(input.tasks.map((task) => task.id))
  const steps = input.tasks.map((step, order) => ({
    id: step.id,
    userId,
    title: step.title,
    description: step.description || null,
    status: step.isCompleted ? ("DONE" as const) : ("TODO" as const),
    dueDate: toDate(step.dueDate),
    estimatedMinutes: step.durationMinutes,
    order,
    // Drop dangling parent references so the self-FK never rejects the batch
    parentId:
      step.parentId && taskIds.has(step.parentId) && step.parentId !== step.id
        ? step.parentId
        : null,
  }))

  const writePlan = () =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.plan.findUnique({
        where: { id: input.id },
        select: { userId: true },
      })

      if (existing && existing.userId !== userId) {
        return null
      }

      const plan = await tx.plan.upsert({
        where: { id: input.id },
        update: {
          name: input.title,
          description: input.description || null,
          completion: input.completion || null,
          totalEstimatedMinutes,
          ...(input.source ? { source: input.source } : {}),
          ...(input.aiMode ? { aiMode: input.aiMode } : {}),
          ...(input.breakdownIntensity
            ? { breakdownIntensity: input.breakdownIntensity }
            : {}),
          ...(input.templateId !== undefined
            ? { templateId: input.templateId }
            : {}),
          ...(input.rubricNotes !== undefined
            ? { rubricNotes: input.rubricNotes }
            : {}),
          ...(input.draftReference !== undefined
            ? { draftReference: input.draftReference }
            : {}),
          ...(input.experienceLevel !== undefined
            ? { experienceLevel: input.experienceLevel }
            : {}),
          deletedAt: null,
        },
        create: {
          id: input.id,
          userId,
          name: input.title,
          description: input.description || null,
          completion: input.completion || null,
          totalEstimatedMinutes,
          source: input.source ?? "MANUAL",
          aiMode: input.aiMode ?? "MANUAL",
          breakdownIntensity: input.breakdownIntensity ?? "NORMAL",
          templateId: input.templateId ?? null,
          rubricNotes: input.rubricNotes ?? null,
          draftReference: input.draftReference ?? null,
          experienceLevel: input.experienceLevel ?? null,
        },
      })

      if (plan.userId !== userId) {
        return null
      }

      // Preserve completionNotes before deleting steps (narrow PATCH writes notes separately,
      // but autosave cycles through deleteMany/createMany which would erase them)
      const existingNotes = await tx.planStep.findMany({
        where: { planId: plan.id },
        select: { id: true, completionNote: true },
      })
      const noteById = new Map(
        existingNotes.map((s) => [s.id, s.completionNote])
      )

      await tx.planStep.deleteMany({ where: { planId: plan.id } })

      if (steps.length > 0) {
        // Parents must be inserted before children for the self-referencing FK
        const orderedForInsert = [
          ...steps.filter((step) => !step.parentId),
          ...steps.filter((step) => step.parentId),
        ]

        await tx.planStep.createMany({
          data: orderedForInsert.map((step) => ({
            ...step,
            planId: plan.id,
            guidance:
              input.tasks.find((t) => t.id === step.id)?.guidance ?? null,
            completionNote: noteById.get(step.id) ?? null,
          })),
          skipDuplicates: true,
        })
      }

      return tx.plan.findFirstOrThrow({
        where: { id: plan.id, userId, deletedAt: null },
        include: { steps: { orderBy: { order: "asc" } } },
      })
    })

  try {
    return await writePlan()
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return writePlan()
    }

    throw error
  }
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
