"use client"

import { BarChart3Icon } from "lucide-react"

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
      title="Overview"
      description="Monitor how users move from planning to focused execution."
      actions={
        <DateRangeSelect value={dateRange} onValueChange={onDateRangeChange} />
      }
    />
  )
}
