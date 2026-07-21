import prisma from "@workspace/db"

type DbClient = typeof prisma

const reviewInclude = {
  steps: { orderBy: { order: "asc" as const } },
  scaffoldQuestions: { orderBy: { order: "asc" as const } },
} as const

export async function listReviewQueue(
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DRAFT" = "PENDING_REVIEW",
  db: DbClient = prisma
) {
  return db.workflowTemplate.findMany({
    where: { status },
    include: reviewInclude,
    orderBy: [{ submittedAt: "asc" }, { updatedAt: "desc" }],
  })
}

export async function approveTemplate(id: string, db: DbClient = prisma) {
  const result = await db.workflowTemplate.updateMany({
    where: { id, status: "PENDING_REVIEW" },
    data: {
      status: "APPROVED",
      rejectionReason: null,
      publishedAt: new Date(),
    },
  })

  if (result.count === 0) {
    return null
  }

  return db.workflowTemplate.findUnique({
    where: { id },
    include: reviewInclude,
  })
}

export async function rejectTemplate(
  id: string,
  reason: string,
  db: DbClient = prisma
) {
  const result = await db.workflowTemplate.updateMany({
    where: { id, status: "PENDING_REVIEW" },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      publishedAt: null,
    },
  })

  if (result.count === 0) {
    return null
  }

  return db.workflowTemplate.findUnique({
    where: { id },
    include: reviewInclude,
  })
}
