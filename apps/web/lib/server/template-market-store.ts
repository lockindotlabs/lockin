import prisma, { Prisma } from "@workspace/db"

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
