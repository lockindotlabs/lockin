import prisma, { Prisma } from "@workspace/db"
import { getTemplateAccessState, type TemplateAccessState } from "@/lib/billing/entitlements"
import type { BillingTier } from "@/lib/billing/catalog"

type DbClient = typeof prisma

const marketTemplateInclude = {
  steps: { orderBy: { order: "asc" as const } },
  scaffoldQuestions: { orderBy: { order: "asc" as const } },
} as const

export async function listMarketTemplates(
  filters: { category?: string; search?: string; userId?: string },
  db: DbClient = prisma
) {
  return db.workflowTemplate.findMany({
    where: buildMarketTemplateWhere(filters),
    include: marketTemplateInclude,
    orderBy: [{ installCount: "desc" }, { publishedAt: "desc" }, { title: "asc" }],
  })
}

export function buildMarketTemplateWhere(filters: {
  category?: string
  search?: string
  userId?: string
}): Prisma.WorkflowTemplateWhereInput {
  const search = filters.search?.trim()
  const visibility: Prisma.WorkflowTemplateWhereInput = filters.userId
    ? { OR: [{ status: "APPROVED" }, { authorId: filters.userId }] }
    : { status: "APPROVED" }
  const clauses: Prisma.WorkflowTemplateWhereInput[] = [visibility]

  if (filters.category) {
    clauses.push({ category: filters.category })
  }

  if (search) {
    clauses.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { domainTags: { has: search } },
      ],
    })
  }

  return {
    AND: clauses,
  }
}

export async function getInstallableTemplate(
  userId: string,
  id: string,
  db: DbClient = prisma
) {
  return db.workflowTemplate.findFirst({
    where: {
      id,
      OR: [{ status: "APPROVED" }, { authorId: userId }],
    },
    include: marketTemplateInclude,
  })
}

export async function incrementInstallCount(id: string, db: DbClient = prisma) {
  const result = await db.workflowTemplate.updateMany({
    where: { id, status: "APPROVED" },
    data: { installCount: { increment: 1 } },
  })

  return result.count > 0
}

export async function getTemplateAccessForUser({
  userId,
  templateId,
  tier,
  db = prisma,
}: {
  userId: string
  templateId: string
  tier: BillingTier
  db?: DbClient
}): Promise<TemplateAccessState | null> {
  const template = await getInstallableTemplate(userId, templateId, db)
  if (!template) return null

  if (template.authorId === userId || template.status !== "APPROVED") {
    return getTemplateAccessState({ tier, marketplaceIndex: 0, isOwned: true })
  }

  const marketTemplates = await listMarketTemplates({}, db)
  const marketplaceIndex = marketTemplates.findIndex((item) => item.id === template.id)

  return getTemplateAccessState({ tier, marketplaceIndex })
}
