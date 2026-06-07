"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import type { ActivityTrendPoint } from "@/types/admin-analytics"
import {
  ChartContainer,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export type ActivitySeriesKey =
  | "users"
  | "aiPlans"
  | "sprints"
  | "completedTasks"

const activitySeries: {
  key: ActivitySeriesKey
  label: string
  color: string
}[] = [
  { key: "users", label: "Users", color: "var(--chart-1)" },
  { key: "aiPlans", label: "AI Plans", color: "var(--chart-2)" },
  { key: "sprints", label: "Sprints", color: "var(--chart-3)" },
  { key: "completedTasks", label: "Completed Tasks", color: "var(--chart-4)" },
]

const chartConfig = activitySeries.reduce((config, item) => {
  config[item.key] = {
    label: item.label,
    color: item.color,
  }

  return config
}, {} as ChartConfig)

function ActivityLineChart({
  data,
  seriesKey,
}: {
  data: ActivityTrendPoint[]
  seriesKey: ActivitySeriesKey
}) {
  return (
    <ChartContainer config={chartConfig} className="h-72 w-full">
      <LineChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} width={42} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey={seriesKey}
          type="monotone"
          stroke={`var(--color-${seriesKey})`}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

export function ActivityTrendChart({
  data,
  activeSeries,
  onActiveSeriesChange,
}: {
  data: ActivityTrendPoint[]
  activeSeries: ActivitySeriesKey
  onActiveSeriesChange: (series: ActivitySeriesKey) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity trends</CardTitle>
        <CardDescription>
          Daily movement across users, AI plans, Sprints, and completed tasks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeSeries}
          onValueChange={(nextValue) => {
            if (nextValue) {
              onActiveSeriesChange(nextValue as ActivitySeriesKey)
            }
          }}
        >
          <div className="overflow-x-auto">
            <TabsList aria-label="Activity chart metric">
              {activitySeries.map((series) => (
                <TabsTrigger key={series.key} value={series.key}>
                  {series.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {activitySeries.map((series) => (
            <TabsContent key={series.key} value={series.key}>
              <ActivityLineChart data={data} seriesKey={series.key} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
