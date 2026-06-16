import { getEffectiveTier } from "../billing/catalog"
import { AI_CATALOG, calculateCredits } from "./catalog"
import type { AiCapability } from "./catalog"

export interface QuotaCheckResult {
  allowed: boolean
  remainingCredits: number
  resetAt?: string
  reason?: string
}

export function validateAiRequest({
  tier,
  modelName,
  requestedCapabilities,
}: {
  tier: string
  modelName: string
  requestedCapabilities: string[]
}) {
  const allAllowedModels = new Set(Object.values(AI_CATALOG).flatMap((c) => c.allowedModels))
  if (!allAllowedModels.has(modelName)) {
    return {
      valid: false,
      status: 400,
      error: { error: "Unknown model ID." },
    }
  }

  const tierConfig = AI_CATALOG[tier as keyof typeof AI_CATALOG]
  if (!tierConfig) {
    return {
      valid: false,
      status: 400,
      error: { error: "Invalid billing tier." },
    }
  }

  if (!tierConfig.allowedModels.includes(modelName)) {
    return {
      valid: false,
      status: 403,
      error: {
        code: "AI_FEATURE_NOT_ALLOWED",
        requiredTier: "PRO",
        message: "This model requires a higher tier plan.",
      },
    }
  }

  for (const cap of requestedCapabilities) {
    if (!tierConfig.allowedCapabilities.includes(cap as AiCapability)) {
      const requiredTier = cap === "complex-reasoning" ? "PRO" : "PLUS"
      return {
        valid: false,
        status: 403,
        error: {
          code: "AI_FEATURE_NOT_ALLOWED",
          requiredTier,
          message: `The capability '${cap}' requires a higher tier plan.`,
        },
      }
    }
  }

  return { valid: true }
}

export async function checkQuotaAndRecordStarted({
  tx,
  userId,
  chatId,
  requestId,
  modelName,
  capabilities,
  tier,
}: {
  tx: any
  userId: string
  chatId?: string
  requestId: string
  modelName: string
  capabilities: string[]
  tier: string
}): Promise<QuotaCheckResult> {
  const tierConfig = AI_CATALOG[tier as keyof typeof AI_CATALOG]
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const monthlyCreditsSum = await tx.aiUsage.aggregate({
    where: {
      userId,
      status: "SUCCESS",
      createdAt: { gte: monthStart },
    },
    _sum: {
      creditsCharged: true,
    },
  })
  const creditsChargedThisMonth = monthlyCreditsSum._sum.creditsCharged ?? 0

  const dailyRequestsCount = await tx.aiUsage.count({
    where: {
      userId,
      status: { in: ["STARTED", "SUCCESS", "ERROR"] },
      createdAt: { gte: dayStart },
    },
  })

  const remainingCredits = Math.max(0, tierConfig.creditsPerMonth - creditsChargedThisMonth)
  const monthlyExceeded = creditsChargedThisMonth >= tierConfig.creditsPerMonth
  const dailyExceeded = dailyRequestsCount >= tierConfig.requestsPerDay

  if (monthlyExceeded || dailyExceeded) {
    const reason = monthlyExceeded ? "MONTHLY_CREDITS_EXCEEDED" : "DAILY_REQUESTS_EXCEEDED"
    await tx.aiUsage.create({
      data: {
        userId,
        chatId,
        requestId,
        status: "BLOCKED",
        modelName,
        capabilities,
        creditMultiplier: calculateCredits({ modelName, capabilities }).multiplier,
        creditsCharged: 0,
        reason,
      },
    })

    const isMonthly = reason === "MONTHLY_CREDITS_EXCEEDED"
    const resetAt = isMonthly
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))

    return {
      allowed: false,
      remainingCredits,
      resetAt: resetAt.toISOString(),
      reason,
    }
  }

  await tx.aiUsage.create({
    data: {
      userId,
      chatId,
      requestId,
      status: "STARTED",
      modelName,
      capabilities,
      creditMultiplier: calculateCredits({ modelName, capabilities }).multiplier,
      creditsCharged: 0,
    },
  })

  return {
    allowed: true,
    remainingCredits,
  }
}

export async function checkPlanCap({
  prisma,
  userId,
  tier,
  source,
  planId,
}: {
  prisma: any
  userId: string
  tier: string
  source?: string
  planId: string
}): Promise<{ allowed: boolean; error?: any }> {
  if (tier === "FREE" && source === "AI") {
    const existing = await prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true },
    })

    const isCreate = !existing
    if (isCreate) {
      const count = await prisma.plan.count({
        where: {
          userId,
          source: "AI",
          deletedAt: null,
        },
      })

      if (count >= 3) {
        return {
          allowed: false,
          error: {
            code: "AI_PLAN_LIMIT_EXCEEDED",
            limit: 3,
            upgradeUrl: "/app/billing",
          },
        }
      }
    }
  }

  return { allowed: true }
}
