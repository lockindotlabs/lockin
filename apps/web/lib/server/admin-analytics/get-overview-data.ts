import prisma from "@workspace/db"

import type {
  ActivityTrendPoint,
  AdminOverviewData,
  DateRangeOption,
  FunnelStep,
  MetricCardData,
} from "@/types/admin-analytics"
import {
  createDailyBuckets,
  formatMetricNumber,
  formatMinutesFromSeconds,
  formatPercent,
  resolveDateRange,
  toDateKey,
} from "./shared"
import { getEffectiveTier } from "@/lib/billing/catalog"

function createOverviewMetrics(input: {
  actionablePlans: number
  activeUsers: number
  averageFocusDurationSeconds: number | null
  focusSessionsCompleted: number
  paidUsers: number
  sessionCompletionRate: number
  successfulPayments: number
  totalUsers: number
  aiRequests: number
  aiCreditsUsed: number
  quotaBlocks: number
  failedGenerations: number
  rangeLabel: string
}): MetricCardData[] {
  return [
    {
      label: "Total Users",
      value: formatMetricNumber(input.totalUsers),
      description: "current total",
      icon: "users",
    },
    {
      label: "Active Users",
      value: formatMetricNumber(input.activeUsers),
      description: input.rangeLabel,
      icon: "activeUsers",
    },
    {
      label: "Actionable Plans",
      value: formatMetricNumber(input.actionablePlans),
      description: "plans with at least one step",
      icon: "actionablePlans",
    },
    {
      label: "Sessions Completed",
      value: formatMetricNumber(input.focusSessionsCompleted),
      description: input.rangeLabel,
      icon: "sprintsCompleted",
    },
    {
      label: "Session Completion Rate",
      value: formatPercent(input.sessionCompletionRate),
      description: input.rangeLabel,
      icon: "completionRate",
    },
    {
      label: "Avg. Focus Duration",
      value: formatMinutesFromSeconds(input.averageFocusDurationSeconds),
      description: input.rangeLabel,
      icon: "focusDuration",
    },
    {
      label: "Paid Users",
      value: formatMetricNumber(input.paidUsers),
      description: "active Plus and Pro access",
      icon: "paidUsers",
    },
    {
      label: "Successful Payments",
      value: formatMetricNumber(input.successfulPayments),
      description: "all-time paid orders",
      icon: "successfulPayments",
    },
    {
      label: "AI Requests",
      value: formatMetricNumber(input.aiRequests),
      description: input.rangeLabel,
      icon: "aiRequests",
    },
    {
      label: "AI Credits Used",
      value: formatMetricNumber(input.aiCreditsUsed),
      description: input.rangeLabel,
      icon: "aiPlans",
    },
    {
      label: "Quota Blocks",
      value: formatMetricNumber(input.quotaBlocks),
      description: input.rangeLabel,
      icon: "quota",
    },
    {
      label: "Failed Generations",
      value: formatMetricNumber(input.failedGenerations),
      description: input.rangeLabel,
      icon: "failedGenerations",
    },
  ]
}

function createFunnelSteps(input: {
  totalUsers: number
  usersWithActionablePlans: number
  usersWithAiPlans: number
  usersWithCompletedSessions: number
  usersWithPlans: number
  usersWithReturnedSessions: number
  usersWithStartedSessions: number
}): FunnelStep[] {
  const steps = [
    { step: "Signed up", users: input.totalUsers },
    { step: "Created first plan", users: input.usersWithPlans },
    { step: "Added plan steps", users: input.usersWithActionablePlans },
    { step: "Created AI-assisted plan", users: input.usersWithAiPlans },
    { step: "Started a focus session", users: input.usersWithStartedSessions },
    {
      step: "Completed a focus session",
      users: input.usersWithCompletedSessions,
    },
    {
      step: "Returned for another session",
      users: input.usersWithReturnedSessions,
    },
  ]

  return steps.map((step) => ({
    ...step,
    conversionRate:
      input.totalUsers > 0 ? (step.users / input.totalUsers) * 100 : 0,
  }))
}

function createTrendData(input: {
  aiPlans: Array<{ createdAt: Date }>
  completedSteps: Array<{ updatedAt: Date }>
  range: ReturnType<typeof resolveDateRange>
  sprints: Array<{ startedAt: Date }>
  users: Array<{ createdAt: Date }>
}): ActivityTrendPoint[] {
  const buckets = createDailyBuckets(input.range)
  const rows = new Map(
    Array.from(buckets.entries()).map(([key, label]) => [
      key,
      {
        date: label,
        users: 0,
        aiPlans: 0,
        sprints: 0,
        completedSteps: 0,
      },
    ])
  )

  for (const item of input.users) {
    const key = toDateKey(item.createdAt)
    const row = rows.get(key)
    if (row) {
      row.users += 1
    }
  }

  for (const item of input.aiPlans) {
    const key = toDateKey(item.createdAt)
    const row = rows.get(key)
    if (row) {
      row.aiPlans += 1
    }
  }

  for (const item of input.sprints) {
    const key = toDateKey(item.startedAt)
    const row = rows.get(key)
    if (row) {
      row.sprints += 1
    }
  }

  for (const item of input.completedSteps) {
    const key = toDateKey(item.updatedAt)
    const row = rows.get(key)
    if (row) {
      row.completedSteps += 1
    }
  }

  return Array.from(rows.values())
}

export async function getOverviewData(
  dateRange: DateRangeOption
): Promise<AdminOverviewData> {
  const range = resolveDateRange(dateRange)

  const [
    totalUsers,
    currentUsers,
    actionablePlans,
    successfulPayments,
    focusSessionsStarted,
    focusSessionsCompleted,
    averageFocusDuration,
    activePlanUsers,
    aiPlanUsers,
    usersWithPlans,
    usersWithStartedSessions,
    usersWithCompletedSessions,
    userSessions,
    activeUsersFromPlans,
    activeUsersFromSessions,
    activeUsersFromPayments,
    recentUsers,
    recentAiPlans,
    recentSprints,
    recentCompletedSteps,
    aiRequests,
    aiCreditsAggregate,
    quotaBlocks,
    failedGenerations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      select: {
        id: true,
        planTier: true,
        planExpiresAt: true,
      },
    }),
    prisma.plan.count({
      where: {
        deletedAt: null,
        steps: {
          some: {},
        },
      },
    }),
    prisma.paymentOrder.count({
      where: {
        status: "PAID",
      },
    }),
    prisma.focusSession.count({
      where: {
        startedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
    prisma.focusSession.count({
      where: {
        startedAt: {
          gte: range.start,
          lte: range.end,
        },
        endedAt: {
          not: null,
        },
      },
    }),
    prisma.focusSession.aggregate({
      where: {
        endedAt: {
          gte: range.start,
          lte: range.end,
        },
        duration: {
          not: null,
        },
      },
      _avg: {
        duration: true,
      },
    }),
    prisma.planStep.findMany({
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.plan.findMany({
      where: {
        deletedAt: null,
        OR: [{ source: "AI" }, { aiMode: "ASSISTED" }],
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.plan.findMany({
      where: {
        deletedAt: null,
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.focusSession.findMany({
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.focusSession.findMany({
      where: {
        endedAt: {
          not: null,
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.focusSession.findMany({
      where: {
        endedAt: {
          not: null,
        },
      },
      select: { userId: true },
      orderBy: [{ userId: "asc" }, { startedAt: "asc" }],
    }),
    prisma.plan.findMany({
      where: {
        deletedAt: null,
        updatedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.focusSession.findMany({
      where: {
        startedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.paymentOrder.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: { createdAt: true },
    }),
    prisma.plan.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
        OR: [{ source: "AI" }, { aiMode: "ASSISTED" }],
      },
      select: { createdAt: true },
    }),
    prisma.focusSession.findMany({
      where: {
        startedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: { startedAt: true },
    }),
    prisma.planStep.findMany({
      where: {
        status: "DONE",
        updatedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: { updatedAt: true },
    }),
    prisma.aiUsage.count({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
    prisma.aiUsage.aggregate({
      where: {
        status: "SUCCESS",
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      _sum: {
        creditsCharged: true,
      },
    }),
    prisma.aiUsage.count({
      where: {
        status: "BLOCKED",
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
    prisma.aiUsage.count({
      where: {
        status: "ERROR",
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
  ])

  const paidUsers = currentUsers.filter(
    (user) => getEffectiveTier(user.planTier, user.planExpiresAt) !== "FREE"
  ).length
  const sessionCompletionRate =
    focusSessionsStarted > 0
      ? (focusSessionsCompleted / focusSessionsStarted) * 100
      : 0
  const activeUsers = new Set<string>([
    ...activeUsersFromPlans.map((item) => item.userId),
    ...activeUsersFromSessions.map((item) => item.userId),
    ...activeUsersFromPayments.map((item) => item.userId),
  ]).size

  const sessionCounts = new Map<string, number>()
  for (const session of userSessions) {
    sessionCounts.set(
      session.userId,
      (sessionCounts.get(session.userId) ?? 0) + 1
    )
  }

  const usersWithReturnedSessions = Array.from(sessionCounts.values()).filter(
    (count) => count > 1
  ).length

  return {
    overviewMetrics: createOverviewMetrics({
      totalUsers,
      activeUsers,
      actionablePlans,
      focusSessionsCompleted,
      sessionCompletionRate,
      averageFocusDurationSeconds: averageFocusDuration._avg.duration ?? null,
      paidUsers,
      successfulPayments,
      aiRequests,
      aiCreditsUsed: aiCreditsAggregate._sum.creditsCharged ?? 0,
      quotaBlocks,
      failedGenerations,
      rangeLabel: range.label,
    }),
    funnelData: createFunnelSteps({
      totalUsers,
      usersWithPlans: usersWithPlans.length,
      usersWithActionablePlans: activePlanUsers.length,
      usersWithAiPlans: aiPlanUsers.length,
      usersWithStartedSessions: usersWithStartedSessions.length,
      usersWithCompletedSessions: usersWithCompletedSessions.length,
      usersWithReturnedSessions,
    }),
    activityTrendData: createTrendData({
      range,
      users: recentUsers,
      aiPlans: recentAiPlans,
      sprints: recentSprints,
      completedSteps: recentCompletedSteps,
    }),
  }
}
