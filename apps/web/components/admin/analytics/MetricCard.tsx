"use client"

import type { ComponentType } from "react"
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BotIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  CrownIcon,
  GaugeIcon,
  ListChecksIcon,
  MousePointerClickIcon,
  PlayIcon,
  SparklesIcon,
  TimerIcon,
  UserCheckIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react"

import type {
  MetricCardData,
  MetricIconKey,
  TrendDirection,
} from "@/types/admin-analytics"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const metricIcons: Record<
  MetricIconKey,
  ComponentType<{ className?: string }>
> = {
  users: UsersIcon,
  activeUsers: UserCheckIcon,
  actionablePlans: ListChecksIcon,
  aiPlans: SparklesIcon,
  sprintsCompleted: CheckCircle2Icon,
  successfulPayments: CreditCardIcon,
  paymentIssues: AlertTriangleIcon,
  completionRate: GaugeIcon,
  focusDuration: TimerIcon,
  quota: AlertTriangleIcon,
  conversion: CreditCardIcon,
  aiRequests: BotIcon,
  successfulGenerations: CheckCircle2Icon,
  failedGenerations: XCircleIcon,
  averageSubtasks: ListChecksIcon,
  sprintsStarted: PlayIcon,
  sprintsAbandoned: XCircleIcon,
  averageSprintDuration: ClockIcon,
  freeUsers: UsersIcon,
  paidUsers: CrownIcon,
  upgradeClicks: MousePointerClickIcon,
}

function getTrendLabel(trend: TrendDirection | undefined) {
  if (trend === "up") {
    return "increase"
  }

  if (trend === "down") {
    return "decrease"
  }

  return "change"
}

function TrendIcon({ trend }: { trend: TrendDirection | undefined }) {
  if (trend === "up") {
    return <ArrowUpIcon data-icon="inline-start" />
  }

  if (trend === "down") {
    return <ArrowDownIcon data-icon="inline-start" />
  }

  return <ArrowRightIcon data-icon="inline-start" />
}

function getTrendBadgeVariant(trend: TrendDirection | undefined) {
  if (trend === "down") {
    return "destructive" as const
  }

  if (trend === "neutral") {
    return "outline" as const
  }

  return "secondary" as const
}

export function MetricCard({ metric }: { metric: MetricCardData }) {
  const Icon = metricIcons[metric.icon]
  const trendLabel = getTrendLabel(metric.trend)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{metric.label}</CardTitle>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
        <div className="flex flex-wrap items-center gap-2">
          {metric.change ? (
            <Badge variant={getTrendBadgeVariant(metric.trend)}>
              <TrendIcon trend={metric.trend} />
              <span>
                {metric.change} {trendLabel}
              </span>
            </Badge>
          ) : null}
          {metric.description ? (
            <CardDescription>{metric.description}</CardDescription>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
