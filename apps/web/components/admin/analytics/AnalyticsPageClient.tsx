"use client"

import { useState } from "react"

import { useAdminData } from "@/lib/admin/use-admin-data"
import type { AdminOverviewData, DateRangeOption } from "@/types/admin-analytics"

import {
  ActivityTrendChart,
  type ActivitySeriesKey,
} from "./ActivityTrendChart"
import { AnalyticsHeader } from "./AnalyticsHeader"
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "./AnalyticsState"
import { CoreFunnel } from "./CoreFunnel"
import { MetricGrid } from "./MetricGrid"

export function AnalyticsPageClient() {
  const [dateRange, setDateRange] = useState<DateRangeOption>("last-7-days")
  const [activitySeries, setActivitySeries] =
    useState<ActivitySeriesKey>("users")
  const { data, error, isLoading } = useAdminData<AdminOverviewData>(
    `/api/admin/overview?range=${dateRange}`
  )

  const hasData =
    (data?.overviewMetrics.length ?? 0) > 0 ||
    (data?.funnelData.length ?? 0) > 0 ||
    (data?.activityTrendData.length ?? 0) > 0

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <AnalyticsHeader dateRange={dateRange} onDateRangeChange={setDateRange} />

      {isLoading ? <AnalyticsLoadingState /> : null}
      {!isLoading && error ? <AnalyticsErrorState /> : null}
      {!isLoading && !error && !hasData ? <AnalyticsEmptyState /> : null}

      {!isLoading && !error && data && hasData ? (
        <div className="flex flex-col gap-8 px-4 pb-10 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
              <p className="text-sm text-muted-foreground">
                Platform health across users, plans, focus sessions, and paid
                access.
              </p>
            </div>
            <MetricGrid metrics={data.overviewMetrics} />
          </section>

          <CoreFunnel data={data.funnelData} />

          <ActivityTrendChart
            data={data.activityTrendData}
            activeSeries={activitySeries}
            onActiveSeriesChange={setActivitySeries}
          />
        </div>
      ) : null}
    </main>
  )
}
