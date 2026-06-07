"use client"

import * as React from "react"
import { TriangleAlertIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { formatMinutes } from "@/lib/focus/focus-api"
import {
  getDurationMismatch,
  nearestPresetAtLeast,
  nearestPresetAtMost,
  type DurationPreset,
} from "@/lib/focus/sprint-duration"

type DurationMismatchNoticeProps = {
  estimatedSeconds: number
  chosenDuration: number
  presets: DurationPreset[]
  selectedStepCount: number
  onPickDuration: (seconds: number) => void
  onTrimLargestStep: () => void
}

/**
 * Reconciliation banner shown in the Sprint Setup Modal when the chosen sprint
 * duration diverges meaningfully from the total estimated time of the steps
 * the user selected. Renders nothing for "none"/"minor" gaps — small mismatches
 * are normal and shouldn't nag the user every time they open the modal.
 */
export default function DurationMismatchNotice({
  estimatedSeconds,
  chosenDuration,
  presets,
  selectedStepCount,
  onPickDuration,
  onTrimLargestStep,
}: DurationMismatchNoticeProps) {
  const mismatch = getDurationMismatch(estimatedSeconds, chosenDuration)

  if (mismatch.level === "none" || mismatch.level === "minor") {
    return null
  }

  const isUnder = mismatch.direction === "under"
  const gapLabel = formatMinutes(Math.round(Math.abs(mismatch.diffSeconds) / 60))
  const estimatedLabel = formatMinutes(Math.round(estimatedSeconds / 60))

  const message = isUnder
    ? `Các bước đã chọn ước tính ~${estimatedLabel}, nhưng sprint chỉ ${formatMinutes(
        Math.round(chosenDuration / 60)
      )} — có thể bạn sẽ chưa làm xong hết (thiếu ~${gapLabel}).`
    : `Sprint dài ${formatMinutes(
        Math.round(chosenDuration / 60)
      )} nhưng các bước đã chọn chỉ ước tính ~${estimatedLabel} — có thể bạn sẽ còn dư thời gian (~${gapLabel}).`

  // Only offer the "major" actions — for "moderate" gaps we just inform,
  // since suggesting changes on every modest gap would get noisy fast.
  const showActions = mismatch.level === "major"

  const suggestedPreset = isUnder
    ? nearestPresetAtLeast(presets, estimatedSeconds)
    : nearestPresetAtMost(presets, estimatedSeconds)
  const suggestedPresetIsCurrent = suggestedPreset.seconds === chosenDuration

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-sm ${
        mismatch.level === "major"
          ? "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200"
          : "border-border bg-muted/40 text-muted-foreground"
      }`}
    >
      <div className="flex items-start gap-2">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
        <p className="leading-snug">{message}</p>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2 pl-6">
          {isUnder && selectedStepCount > 1 && (
            <Button variant="outline" size="sm" onClick={onTrimLargestStep}>
              Bớt bước dài nhất
            </Button>
          )}
          {!suggestedPresetIsCurrent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPickDuration(suggestedPreset.seconds)}
            >
              Đổi sang {suggestedPreset.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
