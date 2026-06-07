import type { DistributionPoint, MetricCardData } from "@/types/admin-analytics"
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

export function SubscriptionSection({
  metrics,
  planDistributionData,
}: {
  metrics: MetricCardData[]
  planDistributionData: DistributionPoint[]
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Subscription and quota
        </h2>
        <p className="text-sm text-muted-foreground">
          Monetization signals from limits, plans, and upgrade discovery.
        </p>
      </div>
      <MetricGrid metrics={metrics} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Plan distribution</CardTitle>
            <CardDescription>
              Current split across Free, Plus, and Pro plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionDonutChart
              data={planDistributionData}
              ariaLabel="Plan distribution"
            />
          </CardContent>
        </Card>
        <InsightCard title="Quota signal">
          Quota exceeded events are a useful upgrade trigger, but they should
          not feel punitive.
        </InsightCard>
      </div>
    </section>
  )
}
