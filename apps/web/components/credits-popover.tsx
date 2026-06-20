"use client"

import * as React from "react"
import { Coins04 } from "@untitledui/icons"
import { CoinsIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Progress, ProgressLabel } from "@workspace/ui/components/progress"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import type { AiUsageSummary } from "@/lib/ai/use-ai-usage-summary"

interface CreditsPopoverProps {
  summary: AiUsageSummary | null
  isLoaded: boolean
}

export function CreditsPopover({ summary, isLoaded }: CreditsPopoverProps) {
  const formattedResetDate = React.useMemo(() => {
    if (!summary?.credits.resetAt) return ""
    return new Date(summary.credits.resetAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  }, [summary?.credits.resetAt])

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant={"outline"} size={"sm"} disabled={!isLoaded}>
            <CoinsIcon className="text-primary" />
            {isLoaded && summary ? (
              <span className="text-xs">{summary.credits.remaining}</span>
            ) : (
              <Skeleton className="h-3 w-10" />
            )}
          </Button>
        }
      />
      <PopoverContent align="end" sideOffset={16}>
        {isLoaded && summary ? (
          <Progress value={summary.credits.percentUsed} className="w-full">
            <ProgressLabel className="text-xs font-normal text-muted-foreground">
              {summary.tier === "FREE"
                ? "Free credits used"
                : summary.tier === "PLUS"
                  ? "Plus credits used"
                  : "Pro credits used"}
            </ProgressLabel>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {summary.credits.used} / {summary.credits.limit}
            </span>
          </Progress>
        ) : (
          <Skeleton className="h-10 w-full" />
        )}

        <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3">
          <Coins04 className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <span className="text-sm leading-snug font-medium text-foreground">
              Credits are used by enrichments and MCP usage
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {isLoaded && summary ? (
                <>
                  Your credits will refresh on {formattedResetDate}. Upgrade your
                  plan to get higher monthly credit limits.
                </>
              ) : (
                <Skeleton className="h-3 w-full" />
              )}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
