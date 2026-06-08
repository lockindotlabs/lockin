import type {
  AdminActivityItem,
  DateRangeOption,
  MetricCardData,
} from "@/types/admin-analytics"
import { getEffectiveTier } from "@/lib/billing/catalog"

type UserTierInput = {
  planTier: "FREE" | "PLUS" | "PRO"
  planExpiresAt: Date | string | null
}

export type DateRangeWindow = {
  end: Date
  label: string
  option: DateRangeOption
  start: Date
}

export function resolveDateRange(option: DateRangeOption): DateRangeWindow {
  const end = new Date()
  const start = new Date(end)

  if (option === "last-7-days") {
    start.setDate(start.getDate() - 6)
  } else if (option === "last-30-days") {
    start.setDate(start.getDate() - 29)
  } else if (option === "last-90-days") {
    start.setDate(start.getDate() - 89)
  } else {
    start.setDate(1)
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return {
    option,
    start,
    end,
    label: getRangeLabel(option),
  }
}

function getRangeLabel(option: DateRangeOption) {
  if (option === "last-7-days") {
    return "last 7 days"
  }

  if (option === "last-30-days") {
    return "last 30 days"
  }

  if (option === "last-90-days") {
    return "last 90 days"
  }

  return "this month"
}

export function formatMetricNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatPercent(value: number) {
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}%`
}

export function formatMinutesFromSeconds(seconds: number | null | undefined) {
  const minutes = (seconds ?? 0) / 60

  return `${minutes.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}m`
}

export function toTierLabel(user: UserTierInput): AdminActivityItem["plan"] {
  const tier = getEffectiveTier(user.planTier, user.planExpiresAt)

  if (tier === "PLUS") {
    return "Plus"
  }

  if (tier === "PRO") {
    return "Pro"
  }

  return "Free"
}

export function toDateKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date)
}

export function createDailyBuckets(range: DateRangeWindow) {
  const labels = new Map<string, string>()
  const cursor = new Date(range.start)

  while (cursor <= range.end) {
    const key = toDateKey(cursor)
    labels.set(key, formatShortDate(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return labels
}

export function getRelativeTimeLabel(date: Date) {
  const now = Date.now()
  const diffSeconds = Math.round((date.getTime() - now) / 1000)
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  const absoluteSeconds = Math.abs(diffSeconds)

  if (absoluteSeconds < 60) {
    return formatter.format(diffSeconds, "second")
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute")
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour")
  }

  const diffDays = Math.round(diffHours / 24)
  return formatter.format(diffDays, "day")
}

export function emptyMetric(
  label: string,
  icon: MetricCardData["icon"],
  description: string
): MetricCardData {
  return {
    label,
    value: "0",
    description,
    icon,
  }
}
