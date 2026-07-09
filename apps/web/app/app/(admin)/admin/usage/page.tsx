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
import { ScrollArea } from "@workspace/ui/components/scroll-area"

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
    <>
      <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
        <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
          <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
        </div>
        <main className="flex flex-col bg-background text-foreground">
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
      </ScrollArea>
    </>
  )
}
