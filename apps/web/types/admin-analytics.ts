export type DateRangeOption =
  | "last-7-days"
  | "last-30-days"
  | "last-90-days"
  | "this-month"

export type TrendDirection = "up" | "down" | "neutral"

export type MetricIconKey =
  | "users"
  | "activeUsers"
  | "actionablePlans"
  | "aiPlans"
  | "sprintsCompleted"
  | "successfulPayments"
  | "paymentIssues"
  | "completionRate"
  | "focusDuration"
  | "quota"
  | "conversion"
  | "aiRequests"
  | "successfulGenerations"
  | "failedGenerations"
  | "averageSubtasks"
  | "sprintsStarted"
  | "sprintsAbandoned"
  | "averageSprintDuration"
  | "freeUsers"
  | "paidUsers"
  | "upgradeClicks"

export type MetricCardData = {
  label: string
  value: string
  change?: string
  trend?: TrendDirection
  description?: string
  icon: MetricIconKey
}

export type FunnelStep = {
  step: string
  users: number
  conversionRate: number
}

export type ActivityTrendPoint = {
  date: string
  users: number
  aiPlans: number
  sprints: number
  completedSteps: number
}

export type AIUsageData = {
  totalRequests: number
  successfulGenerations: number
  failedGenerations: number
  averageSubtasks: number
  averageEstimatedMinutes: number
}

export type DistributionPoint = {
  name: string
  value: number
  key: string
}

export type SprintTrendPoint = {
  date: string
  started: number
  completed: number
}

export type ActivityCategory = "user" | "plan" | "sprint" | "billing"

export type AdminActivityItem = {
  id: string
  user: string
  event: string
  details: string
  plan: "Free" | "Plus" | "Pro"
  time: string
  status: "success" | "error" | "warning" | "info" | "neutral"
  category: ActivityCategory
}

export type RecentActivityEvent = AdminActivityItem

export type EventFilter = "all" | ActivityCategory | "errors"

export type AdminOverviewData = {
  overviewMetrics: MetricCardData[]
  funnelData: FunnelStep[]
  activityTrendData: ActivityTrendPoint[]
}

export type AdminUsageData = {
  sprintMetrics: MetricCardData[]
  sprintTrendData: SprintTrendPoint[]
  recentEvents: AdminActivityItem[]
}

export type AdminBillingData = {
  subscriptionMetrics: MetricCardData[]
  planDistributionData: DistributionPoint[]
}

export type AnalyticsMockData = {
  overviewMetrics: MetricCardData[]
  funnelData: FunnelStep[]
  activityTrendData: ActivityTrendPoint[]
  aiUsage: AIUsageData
  aiUsageMetrics: MetricCardData[]
  breakdownIntensityData: DistributionPoint[]
  sprintMetrics: MetricCardData[]
  sprintTrendData: SprintTrendPoint[]
  subscriptionMetrics: MetricCardData[]
  planDistributionData: DistributionPoint[]
  recentEvents: AdminActivityItem[]
}
