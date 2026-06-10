import prisma from "@workspace/db"

import type {
  AdminBillingData,
  DistributionPoint,
  MetricCardData,
} from "@/types/admin-analytics"
import { getEffectiveTier } from "@/lib/billing/catalog"
import { formatMetricNumber, formatPercent } from "./shared"

function createSubscriptionMetrics(input: {
  failedPayments: number
  freeUsers: number
  paidUsers: number
  successfulPayments: number
  totalUsers: number
}): MetricCardData[] {
  const paidRate =
    input.totalUsers > 0 ? (input.paidUsers / input.totalUsers) * 100 : 0

  return [
    {
      label: "Free Users",
      value: formatMetricNumber(input.freeUsers),
      description: "current effective tier",
      icon: "freeUsers",
    },
    {
      label: "Paid Users",
      value: formatMetricNumber(input.paidUsers),
      description: "current effective tier",
      icon: "paidUsers",
    },
    {
      label: "Paid Conversion",
      value: formatPercent(paidRate),
      description: "paid users / total users",
      icon: "conversion",
    },
    {
      label: "Successful Payments",
      value: formatMetricNumber(input.successfulPayments),
      description: "all paid orders",
      icon: "successfulPayments",
    },
    {
      label: "Payment Issues",
      value: formatMetricNumber(input.failedPayments),
      description: "failed, cancelled, or expired orders",
      icon: "paymentIssues",
    },
  ]
}

function createPlanDistribution(input: {
  freeUsers: number
  plusUsers: number
  proUsers: number
  totalUsers: number
}): DistributionPoint[] {
  const entries = [
    { name: "Free", value: input.freeUsers, key: "free" },
    { name: "Plus", value: input.plusUsers, key: "plus" },
    { name: "Pro", value: input.proUsers, key: "pro" },
  ]

  if (input.totalUsers === 0) {
    return entries
  }

  return entries.map((entry) => ({
    ...entry,
    value: Number(((entry.value / input.totalUsers) * 100).toFixed(1)),
  }))
}

export async function getBillingData(): Promise<AdminBillingData> {
  const [users, successfulPayments, failedPayments] = await Promise.all([
    prisma.user.findMany({
      select: {
        planTier: true,
        planExpiresAt: true,
      },
    }),
    prisma.paymentOrder.count({
      where: {
        status: "PAID",
      },
    }),
    prisma.paymentOrder.count({
      where: {
        status: {
          in: ["FAILED", "CANCELLED", "EXPIRED"],
        },
      },
    }),
  ])

  const tierCounts = {
    FREE: 0,
    PLUS: 0,
    PRO: 0,
  }

  for (const user of users) {
    const tier = getEffectiveTier(user.planTier, user.planExpiresAt)
    tierCounts[tier]++
  }

  return {
    subscriptionMetrics: createSubscriptionMetrics({
      totalUsers: users.length,
      freeUsers: tierCounts.FREE,
      paidUsers: tierCounts.PLUS + tierCounts.PRO,
      successfulPayments,
      failedPayments,
    }),
    planDistributionData: createPlanDistribution({
      totalUsers: users.length,
      freeUsers: tierCounts.FREE,
      plusUsers: tierCounts.PLUS,
      proUsers: tierCounts.PRO,
    }),
  }
}
