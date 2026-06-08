"use client"

import { useMemo, useState } from "react"
import { UsersIcon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "@/components/admin/analytics/AnalyticsState"
import { SprintAnalyticsSection } from "@/components/admin/analytics/SprintAnalyticsSection"
import { RecentActivityTable } from "@/components/admin/analytics/RecentActivityTable"
import { useAdminData } from "@/lib/admin/use-admin-data"
import type {
  AdminActivityItem,
  AdminUsageData,
  EventFilter,
} from "@/types/admin-analytics"

function eventMatchesFilter(event: AdminActivityItem, filter: EventFilter) {
  if (filter === "all") {
    return true
  }

  if (filter === "errors") {
    return event.status === "error"
  }

  return event.category === filter
}

export default function AdminUsagePage() {
  const [eventFilter, setEventFilter] = useState<EventFilter>("all")
  const { data, error, isLoading } = useAdminData<AdminUsageData>(
    "/api/admin/usage"
  )

  const filteredEvents = useMemo(
    () =>
      (data?.recentEvents ?? []).filter((event) =>
        eventMatchesFilter(event, eventFilter)
      ),
    [data?.recentEvents, eventFilter]
  )
  const hasData =
    (data?.sprintMetrics.length ?? 0) > 0 ||
    (data?.recentEvents.length ?? 0) > 0

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <AdminPageHeader
        icon={UsersIcon}
        title="Usage & Retention"
        description="Review focus-session throughput and the most recent product activity."
      />

      {isLoading ? <AnalyticsLoadingState /> : null}
      {!isLoading && error ? <AnalyticsErrorState /> : null}
      {!isLoading && !error && !hasData ? <AnalyticsEmptyState /> : null}

      {!isLoading && !error && data && hasData ? (
        <div className="flex flex-col gap-8 px-4 pb-10 sm:px-6 lg:px-8">
          <SprintAnalyticsSection
            metrics={data.sprintMetrics}
            trendData={data.sprintTrendData}
          />

          <RecentActivityTable
            events={filteredEvents}
            activeFilter={eventFilter}
            onActiveFilterChange={setEventFilter}
          />
        </div>
      ) : null}
    </main>
  )
}
