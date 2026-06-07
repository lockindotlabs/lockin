"use client"

import { Button } from "@workspace/ui/components/button"
import { BarChart3Icon, DownloadIcon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import type { DateRangeOption } from "@/types/admin-analytics"

import { DateRangeSelect } from "./DateRangeSelect"

export function AnalyticsHeader({
  dateRange,
  onDateRangeChange,
}: {
  dateRange: DateRangeOption
  onDateRangeChange: (value: DateRangeOption) => void
}) {
  return (
    <AdminPageHeader
      icon={BarChart3Icon}
      title="Analytics"
      description="Monitor how users move from planning to focused execution."
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <DateRangeSelect
            value={dateRange}
            onValueChange={onDateRangeChange}
          />
          <Button type="button" variant="outline">
            <DownloadIcon data-icon="inline-start" />
            Export
          </Button>
        </div>
      }
    />
  )
}
