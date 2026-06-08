import prisma from "@workspace/db"

import type {
  AdminActivityItem,
  AdminUsageData,
  MetricCardData,
  SprintTrendPoint,
} from "@/types/admin-analytics"
import {
  createDailyBuckets,
  formatMetricNumber,
  formatMinutesFromSeconds,
  formatPercent,
  getRelativeTimeLabel,
  resolveDateRange,
  toDateKey,
  toTierLabel,
} from "./shared"

function createSprintMetrics(input: {
  averageDurationSeconds: number | null
  completed: number
  completionRate: number
  rangeLabel: string
  started: number
}): MetricCardData[] {
  return [
    {
      label: "Sessions Started",
      value: formatMetricNumber(input.started),
      description: input.rangeLabel,
      icon: "sprintsStarted",
    },
    {
      label: "Sessions Completed",
      value: formatMetricNumber(input.completed),
      description: input.rangeLabel,
      icon: "sprintsCompleted",
    },
    {
      label: "Completion Rate",
      value: formatPercent(input.completionRate),
      description: input.rangeLabel,
      icon: "completionRate",
    },
    {
      label: "Avg. Focus Duration",
      value: formatMinutesFromSeconds(input.averageDurationSeconds),
      description: input.rangeLabel,
      icon: "averageSprintDuration",
    },
  ]
}

function createSprintTrendData(input: {
  range: ReturnType<typeof resolveDateRange>
  sessions: Array<{ endedAt: Date | null; startedAt: Date }>
}): SprintTrendPoint[] {
  const buckets = createDailyBuckets(input.range)
  const rows = new Map(
    Array.from(buckets.entries()).map(([key, label]) => [
      key,
      {
        date: label,
        started: 0,
        completed: 0,
      },
    ])
  )

  for (const session of input.sessions) {
    const startedRow = rows.get(toDateKey(session.startedAt))
    if (startedRow) {
      startedRow.started += 1
    }
    if (session.endedAt) {
      const completedRow = rows.get(toDateKey(session.endedAt))
      if (completedRow) {
        completedRow.completed += 1
      }
    }
  }

  return Array.from(rows.values())
}

function buildRecentActivity(items: Array<AdminActivityItem & { at: Date }>) {
  return items
    .sort((left, right) => right.at.getTime() - left.at.getTime())
    .slice(0, 24)
    .map(({ at, ...item }) => ({
      ...item,
      time: getRelativeTimeLabel(at),
    }))
}

export async function getUsageData(): Promise<AdminUsageData> {
  const range = resolveDateRange("last-30-days")

  const [started, completed, averageDuration, sessions, users, plans, orders] =
    await Promise.all([
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
      prisma.focusSession.findMany({
        where: {
          startedAt: {
            gte: range.start,
            lte: range.end,
          },
        },
        select: {
          id: true,
          userId: true,
          startedAt: true,
          endedAt: true,
          completionType: true,
          duration: true,
          plan: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              planTier: true,
              planExpiresAt: true,
            },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 18,
      }),
      prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          createdAt: true,
          planTier: true,
          planExpiresAt: true,
        },
        take: 12,
      }),
      prisma.plan.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              planTier: true,
              planExpiresAt: true,
            },
          },
        },
        take: 18,
      }),
      prisma.paymentOrder.findMany({
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          tier: true,
          user: {
            select: {
              id: true,
              planTier: true,
              planExpiresAt: true,
            },
          },
        },
        take: 18,
      }),
    ])

  const activityItems: Array<AdminActivityItem & { at: Date }> = [
    ...users.map((user) => ({
      id: `signup-${user.id}`,
      user: user.id,
      event: "User signed up",
      details: "Created a LockIn account",
      plan: toTierLabel(user),
      status: "info" as const,
      category: "user" as const,
      at: user.createdAt,
      time: "",
    })),
    ...plans.map((plan) => ({
      id: `plan-${plan.id}`,
      user: plan.user.id,
      event: "Plan saved",
      details: plan.name,
      plan: toTierLabel(plan.user),
      status: "success" as const,
      category: "plan" as const,
      at: plan.updatedAt,
      time: "",
    })),
    ...sessions
      .filter((session) => session.endedAt)
      .map((session) => ({
        id: `session-${session.id}`,
        user: session.userId,
        event:
          session.completionType === "EARLY"
            ? "Sprint ended early"
            : session.completionType === "OVERTIME"
              ? "Sprint completed in overtime"
              : "Sprint completed",
        details: session.plan?.name ?? "Focus session",
        plan: toTierLabel(session.user),
        status:
          session.completionType === "NORMAL"
            ? ("success" as const)
            : session.completionType === "OVERTIME"
              ? ("warning" as const)
              : ("neutral" as const),
        category: "sprint" as const,
        at: session.endedAt ?? session.startedAt,
        time: "",
      })),
    ...orders.map((order) => ({
      id: `payment-${order.id}`,
      user: order.user.id,
      event:
        order.status === "PAID"
          ? "Payment succeeded"
          : order.status === "PENDING"
            ? "Payment pending"
            : order.status === "CANCELLED"
              ? "Payment cancelled"
              : "Payment issue",
      details: `${order.tier} order is ${order.status.toLowerCase()}`,
      plan: toTierLabel(order.user),
      status:
        order.status === "PAID"
          ? ("success" as const)
          : order.status === "PENDING"
            ? ("info" as const)
            : ("error" as const),
      category: "billing" as const,
      at: order.updatedAt,
      time: "",
    })),
  ]

  return {
    sprintMetrics: createSprintMetrics({
      started,
      completed,
      completionRate: started > 0 ? (completed / started) * 100 : 0,
      averageDurationSeconds: averageDuration._avg.duration ?? null,
      rangeLabel: range.label,
    }),
    sprintTrendData: createSprintTrendData({
      range,
      sessions: sessions.map((session) => ({
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      })),
    }),
    recentEvents: buildRecentActivity(activityItems),
  }
}
