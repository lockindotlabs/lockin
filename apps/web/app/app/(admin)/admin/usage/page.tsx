"use client"

import { useMemo, useState } from "react"
import { UsersIcon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminPlaceholderState } from "@/components/admin/AdminPlaceholderState"
import { AIUsageSection } from "@/components/admin/analytics/AIUsageSection"
import { SprintAnalyticsSection } from "@/components/admin/analytics/SprintAnalyticsSection"
import { RecentActivityTable } from "@/components/admin/analytics/RecentActivityTable"
import { analyticsMockData } from "@/lib/mock/admin-analytics"
import type { EventFilter, RecentActivityEvent } from "@/types/admin-analytics"

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

export default function AdminUsersPage() {
  const [eventFilter, setEventFilter] = useState<EventFilter>("all")

  const data = analyticsMockData

  const filteredEvents = useMemo(
    () =>
      data.recentEvents.filter((event) =>
        eventMatchesFilter(event, eventFilter)
      ),
    [data.recentEvents, eventFilter]
  )

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <AdminPageHeader
        icon={UsersIcon}
        title="Users"
        description="Review account activity, retention signals, and support-facing user health."
      />

      <div className="flex flex-col gap-8 px-4 pb-10 sm:px-6 lg:px-8">
        <AIUsageSection
          aiUsage={data.aiUsage}
          metrics={data.aiUsageMetrics}
          breakdownIntensityData={data.breakdownIntensityData}
        />

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
    </main>
  )
}
