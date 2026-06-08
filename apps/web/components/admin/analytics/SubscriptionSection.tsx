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
          Subscription health
        </h2>
        <p className="text-sm text-muted-foreground">
          Current plan mix and payment-state health from billing records.
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
        <InsightCard title="Billing note">
          This view tracks current access tiers and payment outcomes. It does
          not infer upgrade intent until quota and click events are recorded for
          real.
        </InsightCard>
      </div>
    </section>
  )
}
