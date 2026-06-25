"use client"

import * as React from "react"
import type { HeatmapCell } from "@/lib/server/me-stats"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 24 }, (_, h) => h)

function qualityColor(avgQuality: number): string {
  if (avgQuality >= 0.7) return "16, 185, 129" // emerald — on time
  if (avgQuality >= 0.4) return "245, 158, 11" // amber — completed but late
  return "244, 63, 94" // rose — not on time / gave up
}

function formatHour(h: number): string {
  if (h === 0) return "12am"
  if (h === 12) return "12pm"
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

// GitHub-contributions-style grid — hue encodes quality (on time vs late vs
// not on time), opacity encodes how many sprints landed in that day×hour
// slot. Reuses the `--lvl` CSS-variable opacity pattern from the landing
// page's marketing heatmap (apps/web/app/page.tsx Heatmap()), but the hue
// here is driven by real data instead of a fixed color.
export function TimingHeatmap({
  cells,
  maxVolume,
}: {
  cells: HeatmapCell[]
  maxVolume: number
}) {
  const cellMap = new Map(cells.map((c) => [`${c.dayOfWeek}-${c.hour}`, c]))

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-cols-[auto_repeat(24,minmax(14px,1fr))] gap-[3px]">
        <div />
        {HOURS.map((h) =>
          h % 3 === 0 ? (
            <div
              key={`label-${h}`}
              className="col-span-3 text-[9px] text-muted-foreground"
            >
              {formatHour(h)}
            </div>
          ) : null
        )}

        {DAY_LABELS.map((label, dayOfWeek) => (
          <React.Fragment key={label}>
            <div className="flex items-center pr-2 text-[10px] text-muted-foreground">
              {label}
            </div>
            {HOURS.map((hour) => {
              const cell = cellMap.get(`${dayOfWeek}-${hour}`)
              const lvl = cell ? Math.max(0.12, cell.volume / Math.max(1, maxVolume)) : 0.06
              const color = cell ? qualityColor(cell.avgQuality) : "120, 120, 120"
              const title = cell
                ? `${cell.volume} sprint${cell.volume === 1 ? "" : "s"} · ${cell.onTimeCount} on time · ${cell.lateCount} not on time`
                : "No sprints"

              return (
                <div
                  key={`${dayOfWeek}-${hour}`}
                  title={title}
                  className="aspect-square rounded-[3px]"
                  style={{ backgroundColor: `rgba(${color}, ${lvl})` }}
                />
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
