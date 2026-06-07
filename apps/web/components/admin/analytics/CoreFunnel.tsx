import type { FunnelStep } from "@/types/admin-analytics"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"

import { InsightCard } from "./InsightCard"

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function formatPercent(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`
}

function getDropOff(current: FunnelStep, previous: FunnelStep | undefined) {
  if (!previous) {
    return null
  }

  return ((previous.users - current.users) / previous.users) * 100
}

export function CoreFunnel({ data }: { data: FunnelStep[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Core funnel</CardTitle>
          <CardDescription>
            How users move through capture, planning, Sprint, and return.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {data.map((step, index) => {
            const dropOff = getDropOff(step, data[index - 1])

            return (
              <div key={step.step} className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">
                      {step.step}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(step.users)} users
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge variant="secondary">
                      {formatPercent(step.conversionRate)}
                    </Badge>
                    <Badge variant="outline">
                      {dropOff === null
                        ? "Baseline"
                        : `Drop-off: -${formatPercent(dropOff)}`}
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={step.conversionRate}
                  aria-label={`${step.step} conversion ${formatPercent(
                    step.conversionRate
                  )}`}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <InsightCard title="Funnel health">
          AI breakdown is converting well into saved plans, but fewer users
          start a Sprint immediately after editing.
        </InsightCard>
        <InsightCard title="Largest drop-off">
          The largest drop-off is after first Sprint completion, so post-Sprint
          scheduling may need improvement.
        </InsightCard>
      </div>
    </section>
  )
}
