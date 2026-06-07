import type { MetricCardData } from "@/types/admin-analytics"

import { MetricCard } from "./MetricCard"

export function MetricGrid({ metrics }: { metrics: MetricCardData[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  )
}
