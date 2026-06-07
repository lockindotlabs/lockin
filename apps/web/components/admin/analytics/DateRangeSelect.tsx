"use client"

import type { DateRangeOption } from "@/types/admin-analytics"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

const dateRangeOptions: { label: string; value: DateRangeOption }[] = [
  { label: "Last 7 days", value: "last-7-days" },
  { label: "Last 30 days", value: "last-30-days" },
  { label: "Last 90 days", value: "last-90-days" },
  { label: "This month", value: "this-month" },
  { label: "Custom", value: "custom" },
]

export function DateRangeSelect({
  value,
  onValueChange,
}: {
  value: DateRangeOption
  onValueChange: (value: DateRangeOption) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange(nextValue as DateRangeOption)
        }
      }}
    >
      <SelectTrigger aria-label="Date range">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {dateRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
