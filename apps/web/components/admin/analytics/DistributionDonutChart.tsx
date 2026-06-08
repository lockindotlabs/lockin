"use client"

import { Cell, Pie, PieChart } from "recharts"

import type { DistributionPoint } from "@/types/admin-analytics"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function buildChartConfig(data: DistributionPoint[]) {
  return data.reduce((config, point, index) => {
    config[point.key] = {
      label: point.name,
      color: chartColors[index % chartColors.length],
    }

    return config
  }, {} as ChartConfig)
}

export function DistributionDonutChart({
  data,
  ariaLabel,
}: {
  data: DistributionPoint[]
  ariaLabel: string
}) {
  const chartConfig = buildChartConfig(data)

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto h-64 w-full max-w-md"
      aria-label={ariaLabel}
    >
      <PieChart accessibilityLayer>
        <ChartTooltip
          content={<ChartTooltipContent hideLabel nameKey="key" />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} />
      </PieChart>
    </ChartContainer>
  )
}
