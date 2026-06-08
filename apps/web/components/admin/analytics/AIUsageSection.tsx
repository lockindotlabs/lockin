import type {
  AIUsageData,
  DistributionPoint,
  MetricCardData,
} from "@/types/admin-analytics"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { DistributionDonutChart } from "./DistributionDonutChart"
import { InsightCard } from "./InsightCard"
import { MetricGrid } from "./MetricGrid"

export function AIUsageSection({
  aiUsage,
  metrics,
  breakdownIntensityData,
}: {
  aiUsage: AIUsageData
  metrics: MetricCardData[]
  breakdownIntensityData: DistributionPoint[]
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          AI planning usage
        </h2>
        <p className="text-sm text-muted-foreground">
          How often users ask LockIn to turn messy work into manageable plans.
        </p>
      </div>
      <MetricGrid metrics={metrics} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Breakdown intensity</CardTitle>
            <CardDescription>
              Distribution of planning requests by user energy level.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DistributionDonutChart
              data={breakdownIntensityData}
              ariaLabel="Breakdown intensity distribution"
            />
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {aiUsage.averageSubtasks} average subtasks
              </Badge>
              <Badge variant="outline">
                {aiUsage.averageEstimatedMinutes} average estimated minutes
              </Badge>
            </div>
          </CardContent>
        </Card>

        <InsightCard title="Planning behavior">
          Low-energy breakdowns are used most often by users who need smaller
          steps before starting.
        </InsightCard>
      </div>
    </section>
  )
}
