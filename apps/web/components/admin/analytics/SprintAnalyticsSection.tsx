"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import type { MetricCardData, SprintTrendPoint } from "@/types/admin-analytics"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { InsightCard } from "./InsightCard"
import { MetricGrid } from "./MetricGrid"

const sprintChartConfig = {
  started: {
    label: "Started",
    color: "var(--chart-1)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function SprintStartedCompletedChart({ data }: { data: SprintTrendPoint[] }) {
  return (
    <ChartContainer config={sprintChartConfig} className="h-72 w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} width={42} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="started" fill="var(--color-started)" radius={4} />
        <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

export function SprintAnalyticsSection({
  metrics,
  trendData,
}: {
  metrics: MetricCardData[]
  trendData: SprintTrendPoint[]
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Sprint performance
        </h2>
        <p className="text-sm text-muted-foreground">
          Started and completed focus sessions across the selected period.
        </p>
      </div>
      <MetricGrid metrics={metrics} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Started vs completed</CardTitle>
            <CardDescription>
              Daily Sprint starts compared with successful completions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SprintStartedCompletedChart data={trendData} />
          </CardContent>
        </Card>
        <InsightCard title="Sprint completion">
          Sprint completion rate is 68.4%. Users complete more Sprints when the
          estimated duration is under 45 minutes.
        </InsightCard>
      </div>
    </section>
  )
}
