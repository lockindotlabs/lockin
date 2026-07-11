import prisma, { Prisma } from "@workspace/db"

import { getOwnedPlan } from "./plan-store"
import {
  canTransitionTemplateStatus,
  flattenPlanStepsForTemplate,
  generateUserTemplateSlug,
} from "./template-authoring-helpers"
import type { TemplateDraftInput, TemplateStatus } from "./template-schemas"

type DbClient = typeof prisma

const templateInclude = {
  steps: { orderBy: { order: "asc" as const } },
  scaffoldQuestions: { orderBy: { order: "asc" as const } },
} satisfies Prisma.WorkflowTemplateInclude

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  )
}

function normalizePrice(priceVnd: number | null | undefined) {
  return priceVnd && priceVnd > 0 ? priceVnd : null
}

function toTemplateChildren(input: TemplateDraftInput) {
  return {
    steps: {
      create: input.steps.map((step, index) => ({
        order: index + 1,
        title: step.title,
        guidance: step.guidance,
        estimatedMinutes: step.estimatedMinutes,
      })),
    },
    scaffoldQuestions: {
      create: input.scaffoldQuestions.map((question, index) => ({
        order: index + 1,
        prompt: question.prompt,
        helperText: question.helperText,
        aiPurpose: question.aiPurpose,
      })),
    },
  }
}

async function replaceTemplateChildren(
  tx: Prisma.TransactionClient,
  templateId: string,
  input: TemplateDraftInput
) {
  await tx.workflowTemplateStep.deleteMany({ where: { templateId } })
  await tx.workflowScaffoldQuestion.deleteMany({ where: { templateId } })

  if (input.steps.length > 0) {
    await tx.workflowTemplateStep.createMany({
      data: input.steps.map((step, index) => ({
        templateId,
        order: index + 1,
        title: step.title,
        guidance: step.guidance,
        estimatedMinutes: step.estimatedMinutes,
      })),
    })
  }

  if (input.scaffoldQuestions.length > 0) {
    await tx.workflowScaffoldQuestion.createMany({
      data: input.scaffoldQuestions.map((question, index) => ({
        templateId,
        order: index + 1,
        prompt: question.prompt,
        helperText: question.helperText,
        aiPurpose: question.aiPurpose,
      })),
    })
  }
}

async function createTemplateRecord(
  db: DbClient,
  userId: string,
  authorName: string | null,
  input: TemplateDraftInput,
  sourcePlanId: string | null
) {
  return db.workflowTemplate.create({
    data: {
      slug: generateUserTemplateSlug(input.title),
      title: input.title,
      category: input.category,
      description: input.description,
      goalTemplate: input.goalTemplate,
      customRequirements: input.customRequirements,
      isAcademic: input.isAcademic,
      domainTags: input.domainTags,
      outputType: input.outputType,
      supportsGroupMode: input.supportsGroupMode,
      authorId: userId,
      authorName,
      status: "DRAFT",
      installCount: 0,
      priceVnd: normalizePrice(input.priceVnd),
      rejectionReason: null,
      publishedAt: null,
      submittedAt: null,
      sourcePlanId,
      ...toTemplateChildren(input),
    },
    include: templateInclude,
  })
}

export async function listOwnedTemplates(
  userId: string,
  db: DbClient = prisma
) {
  return db.workflowTemplate.findMany({
    where: { authorId: userId },
    include: templateInclude,
    orderBy: [{ updatedAt: "desc" }],
  })
}

export async function getOwnedTemplate(
  userId: string,
  id: string,
  db: DbClient = prisma
) {
  return db.workflowTemplate.findFirst({
    where: { id, authorId: userId },
    include: templateInclude,
  })
}

export async function createTemplate(
  userId: string,
  authorName: string | null,
  input: TemplateDraftInput,
  db: DbClient = prisma
) {
  const write = () => createTemplateRecord(db, userId, authorName, input, null)

  try {
    return await write()
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return write()
    }

    throw error
  }
}

export async function updateOwnedTemplate(
  userId: string,
  id: string,
  input: TemplateDraftInput,
  db: DbClient = prisma
) {
  const existing = await db.workflowTemplate.findFirst({
    where: { id, authorId: userId },
    select: { id: true, status: true },
  })

  if (!existing) {
    return { error: "NOT_FOUND" as const }
  }

  if (!(existing.status === "DRAFT" || existing.status === "REJECTED")) {
    return { error: "CONFLICT" as const }
  }

  await db.$transaction(async (tx) => {
    await tx.workflowTemplate.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        category: input.category,
        description: input.description,
        goalTemplate: input.goalTemplate,
        customRequirements: input.customRequirements,
        isAcademic: input.isAcademic,
        domainTags: input.domainTags,
        outputType: input.outputType,
        supportsGroupMode: input.supportsGroupMode,
        priceVnd: normalizePrice(input.priceVnd),
        status: "DRAFT",
        rejectionReason: null,
        submittedAt: null,
        publishedAt: existing.status === "REJECTED" ? null : undefined,
      },
    })

    await replaceTemplateChildren(tx, existing.id, input)
  })

  const template = await getOwnedTemplate(userId, existing.id, db)
  return { template }
}

export async function deleteOwnedTemplate(
  userId: string,
  id: string,
  db: DbClient = prisma
) {
  const existing = await db.workflowTemplate.findFirst({
    where: { id, authorId: userId },
    select: { id: true, status: true },
  })

  if (!existing) {
    return { error: "NOT_FOUND" as const }
  }

  if (existing.status === "APPROVED") {
    const template = await db.workflowTemplate.update({
      where: { id: existing.id },
      data: {
        status: "DRAFT",
        publishedAt: null,
        submittedAt: null,
        rejectionReason: null,
      },
      include: templateInclude,
    })

    return { template, mode: "UNPUBLISHED" as const }
  }

  await db.workflowTemplate.delete({ where: { id: existing.id } })
  return { mode: "DELETED" as const }
}

export async function submitTemplateForReview(
  userId: string,
  id: string,
  authorName: string | null,
  db: DbClient = prisma
) {
  const existing = await db.workflowTemplate.findFirst({
    where: { id, authorId: userId },
    include: templateInclude,
  })

  if (!existing) {
    return { error: "NOT_FOUND" as const }
  }

  if (
    !canTransitionTemplateStatus(
      existing.status as TemplateStatus,
      "PENDING_REVIEW"
    )
  ) {
    return { error: "CONFLICT" as const }
  }

  if (existing.steps.length < 1) {
    return { error: "INVALID" as const }
  }

  const template = await db.workflowTemplate.update({
    where: { id: existing.id },
    data: {
      status: "PENDING_REVIEW",
      submittedAt: new Date(),
      rejectionReason: null,
      authorName,
    },
    include: templateInclude,
  })

  return { template }
}

export async function unpublishTemplate(
  userId: string,
  id: string,
  db: DbClient = prisma
) {
  const existing = await db.workflowTemplate.findFirst({
    where: { id, authorId: userId },
    select: { id: true, status: true },
  })

  if (!existing) {
    return { error: "NOT_FOUND" as const }
  }

  if (
    !canTransitionTemplateStatus(existing.status as TemplateStatus, "DRAFT")
  ) {
    return { error: "CONFLICT" as const }
  }

  const template = await db.workflowTemplate.update({
    where: { id: existing.id },
    data: {
      status: "DRAFT",
      publishedAt: null,
      submittedAt: null,
      rejectionReason: null,
    },
    include: templateInclude,
  })

  return { template }
}

export async function snapshotPlanAsTemplate(
  userId: string,
  planId: string,
  authorName: string | null,
  db: DbClient = prisma
) {
  const plan = await getOwnedPlan(userId, planId)

  if (!plan) {
    return { error: "NOT_FOUND" as const }
  }

  const steps = flattenPlanStepsForTemplate(
    plan.steps.map((step) => ({
      id: step.id,
      title: step.title,
      description: step.description,
      guidance: step.guidance,
      estimatedMinutes: step.estimatedMinutes,
      order: step.order,
      parentId: step.parentId,
    }))
  )

  const templateInput: TemplateDraftInput = {
    title: plan.name,
    category: "user-plan-template",
    description: plan.description ?? plan.name,
    goalTemplate: `Hoàn thành ${plan.name} với {output cụ thể} sẵn sàng gửi đi.`,
    isAcademic: false,
    domainTags: [],
    outputType: "PROJECT",
    supportsGroupMode: false,
    priceVnd: null,
    steps: steps.map((step) => ({
      title: step.title,
      guidance: step.guidance,
      estimatedMinutes: step.estimatedMinutes,
    })),
    scaffoldQuestions: [],
    customRequirements: [],
  }

  const write = () =>
    createTemplateRecord(db, userId, authorName, templateInput, plan.id)

  try {
    const template = await write()
    return { template }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const template = await write()
      return { template }
    }

    throw error
  }
}
