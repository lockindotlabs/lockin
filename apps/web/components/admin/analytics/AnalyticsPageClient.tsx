"use client"

import { useMemo, useState } from "react"

import { analyticsMockData } from "@/lib/mock/admin-analytics"
import type {
  DateRangeOption,
  EventFilter,
  RecentActivityEvent,
} from "@/types/admin-analytics"

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

type AnalyticsState = "loading" | "ready" | "empty" | "error"

function eventMatchesFilter(event: RecentActivityEvent, filter: EventFilter) {
  const eventName = event.event.toLowerCase()

  if (filter === "all") {
    return true
  }

  if (filter === "sprint") {
    return eventName.includes("sprint")
  }

  if (filter === "ai") {
    return eventName.includes("ai") || eventName.includes("breakdown")
  }

  if (filter === "quota") {
    return eventName.includes("quota")
  }

  if (filter === "upgrade") {
    return eventName.includes("upgrade")
  }

  return event.status === "error"
}

export function AnalyticsPageClient() {
  const [dateRange, setDateRange] = useState<DateRangeOption>("last-7-days")
  const [activitySeries, setActivitySeries] =
    useState<ActivitySeriesKey>("users")
  const [eventFilter, setEventFilter] = useState<EventFilter>("all")
  const [analyticsState] = useState<AnalyticsState>("ready")

  const data = analyticsMockData
  const filteredEvents = useMemo(
    () =>
      data.recentEvents.filter((event) =>
        eventMatchesFilter(event, eventFilter)
      ),
    [data.recentEvents, eventFilter]
  )

  const hasData =
    data.overviewMetrics.length > 0 &&
    data.funnelData.length > 0 &&
    data.activityTrendData.length > 0

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <AnalyticsHeader dateRange={dateRange} onDateRangeChange={setDateRange} />

      {analyticsState === "loading" ? <AnalyticsLoadingState /> : null}
      {analyticsState === "error" ? <AnalyticsErrorState /> : null}
      {analyticsState === "empty" || !hasData ? <AnalyticsEmptyState /> : null}

      {analyticsState === "ready" && hasData ? (
        <div className="flex flex-col gap-8 px-4 pb-10 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
              <p className="text-sm text-muted-foreground">
                Platform health across users, AI plans, Sprints, quota, and
                conversion.
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
