"use client"

import * as React from "react"
import type { HeatmapCell } from "@/lib/server/me-stats"

const DAY_ROW_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] // Sun..Sat, GitHub only labels Mon/Wed/Fri
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]
const WEEKS_TO_SHOW = 53

type DayCell = {
  date: Date
  cell: HeatmapCell | undefined
}

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Builds WEEKS_TO_SHOW columns of 7 days (Sun-Sat) ending on the most recent
// Saturday on/after today, matching GitHub's contribution calendar grid.
function buildWeeks(cells: HeatmapCell[]): DayCell[][] {
  const byDate = new Map(cells.map((c) => [c.date, c]))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + (6 - end.getDay())) // push to this week's Saturday

  const start = new Date(end)
  start.setDate(start.getDate() - (WEEKS_TO_SHOW * 7 - 1))

  const weeks: DayCell[][] = []
  const cursor = new Date(start)
  for (let w = 0; w < WEEKS_TO_SHOW; w++) {
    const week: DayCell[] = []
    for (let d = 0; d < 7; d++) {
      week.push({ date: new Date(cursor), cell: byDate.get(dateKey(cursor)) })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function qualityColor(avgQuality: number): string {
  if (avgQuality >= 0.7) return "16, 185, 129" // emerald — on time
  if (avgQuality >= 0.4) return "245, 158, 11" // amber — completed but late
  return "244, 63, 94" // rose — not on time / gave up
}

// GitHub-contributions-style calendar — one column per week, 7 rows for
// Sun-Sat, month labels above the column where that month starts. Hue
// encodes quality (on time vs late vs not on time) instead of GitHub's
// single-color volume scale, since that's the more useful signal here.
export function TimingHeatmap({
  cells,
  maxVolume,
}: {
  cells: HeatmapCell[]
  maxVolume: number
}) {
  const weeks = React.useMemo(() => buildWeeks(cells), [cells])

  let lastMonth = -1
  const monthLabels: { weekIndex: number; label: string }[] = []
  weeks.forEach((week, weekIndex) => {
    const firstOfMonthDay = week.find((d) => d.date.getDate() <= 7)
    if (firstOfMonthDay) {
      const month = firstOfMonthDay.date.getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ weekIndex, label: MONTH_LABELS[month]! })
        lastMonth = month
      }
    }
  })

  return (
    <div className="w-full rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex w-full flex-col gap-1">
        <div className="relative ml-7 h-4 text-[10px] text-muted-foreground">
          {monthLabels.map(({ weekIndex, label }) => (
            <span
              key={`${label}-${weekIndex}`}
              className="absolute"
              style={{ left: `${(weekIndex / WEEKS_TO_SHOW) * 100}%` }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex w-full gap-1">
          <div className="flex w-7 shrink-0 flex-col gap-[2px]">
            {DAY_ROW_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex h-[11px] items-center text-[9px] text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex w-full gap-[2px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-1 flex-col gap-[2px]">
                {week.map(({ date, cell }, dayIndex) => {
                  const isFuture = date > new Date()
                  const lvl = cell
                    ? Math.max(0.15, cell.volume / Math.max(1, maxVolume))
                    : 0
                  const color = cell ? qualityColor(cell.avgQuality) : "120, 120, 120"
                  const title = isFuture
                    ? undefined
                    : cell
                      ? `${dateKey(date)} · ${cell.volume} sprint${cell.volume === 1 ? "" : "s"} · ${cell.onTimeCount} on time · ${cell.lateCount} not on time`
                      : `${dateKey(date)} · no sprints`

                  return (
                    <div
                      key={dayIndex}
                      title={title}
                      className="h-[11px] w-full rounded-[2px]"
                      style={{
                        backgroundColor: isFuture
                          ? "transparent"
                          : `rgba(${color}, ${lvl || 0.08})`,
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
