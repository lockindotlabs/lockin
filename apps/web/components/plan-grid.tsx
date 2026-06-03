"use client"

import { formatDistanceToNow } from "date-fns"
import { ListCheckIcon, MessageCircleIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import type { PlanSummary } from "@/lib/plans/plan-repository"
import { buildPlanHref } from "@/lib/routing/plan-url"

export type RecentlyOpenedPlan = PlanSummary & {
  lastOpenedAt: string | null
}

type PlanGridProps = {
  plans: RecentlyOpenedPlan[]
  onDeletePlan?: (plan: RecentlyOpenedPlan) => void
}

function getPlanTitle(plan: PlanSummary) {
  return plan.title.trim() || "Untitled Plan"
}

function getPlanTimestamp(plan: RecentlyOpenedPlan) {
  const timestamp = plan.lastOpenedAt ?? plan.updatedAt

  if (!timestamp) {
    return "Recently"
  }

  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

export function PlanGrid({ plans, onDeletePlan }: PlanGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => {
        const planTitle = getPlanTitle(plan)

        return (
          <article
            key={plan.id}
            className={cn(
              "group relative min-h-40 rounded-xl border border-border/70 bg-background transition-colors hover:border-border hover:bg-muted/30",
              onDeletePlan && "pr-10"
            )}
          >
            <Link
              href={buildPlanHref({ planId: plan.id })}
              className="flex h-full min-w-0 flex-col justify-between gap-6 p-4"
            >
              <div className="flex min-w-0 flex-col gap-4">
                <ListCheckIcon
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="line-clamp-2 text-base font-medium text-balance">
                  {planTitle}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {getPlanTimestamp(plan)}
              </p>
            </Link>
            {onDeletePlan ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${planTitle}`}
                className="absolute top-4 right-4 opacity-70 hover:opacity-100"
                onClick={() => onDeletePlan(plan)}
              >
                <Trash2Icon />
              </Button>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
