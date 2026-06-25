"use client"

import * as React from "react"
import { Asterisk02 } from "@untitledui/icons"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Progress, ProgressLabel } from "@workspace/ui/components/progress"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import type { AiUsageSummary } from "@/lib/ai/use-ai-usage-summary"

interface AiPlansPopoverProps {
  summary: AiUsageSummary | null
  isLoaded: boolean
}

export function AiPlansPopover({ summary, isLoaded }: AiPlansPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant={"outline"} size={"sm"} disabled={!isLoaded}>
            <Asterisk02 className="text-primary" />
            {isLoaded && summary ? (
              <span className="text-xs">
                {summary.aiPlans.limit !== null
                  ? `${summary.aiPlans.created}/${summary.aiPlans.limit} AI Plans`
                  : `${summary.aiPlans.created} AI Plans`}
              </span>
            ) : (
              <Skeleton className="h-3 w-16" />
            )}
          </Button>
        }
      />
      <PopoverContent align="end" sideOffset={16}>
        {isLoaded && summary ? (
          summary.aiPlans.limit !== null ? (
            <Progress
              value={summary.aiPlans.percentUsed ?? 0}
              className="w-full"
            >
              <ProgressLabel className="text-xs font-normal text-muted-foreground">
                AI Plans created
              </ProgressLabel>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {summary.aiPlans.created} / {summary.aiPlans.limit}
              </span>
            </Progress>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-muted-foreground">
                  AI Plans created
                </span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {summary.aiPlans.created} / Unlimited
                </span>
              </div>
              <Progress value={0} className="w-full opacity-50" />
            </div>
          )
        ) : (
          <Skeleton className="h-10 w-full" />
        )}

        <div className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <Asterisk02 className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <span className="text-sm leading-snug font-medium text-foreground">
              Plans are created by the AI Planner
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Upgrade your plan to get unlimited plans with the AI Planner.
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
