"use client"

import * as React from "react"
import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import { ArrowLeftIcon, InboxIcon, ListCheckIcon } from "lucide-react"
import Link from "next/link"

import { PlanGrid, type RecentlyOpenedPlan } from "@/components/plan-grid"
import { deletePlan } from "@/lib/plans/plan-repository"
import { useRecentlyOpenedPlans } from "@/lib/plans/recently-opened-plans"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { cn } from "@/lib/utils"

function getPlanCategory(plan: {
  steps?: {
    isCompleted: boolean
    dueDate: string | null
  }[]
}) {
  const steps = plan.steps || []
  if (steps.length > 0 && steps.every((s) => s.isCompleted)) {
    return "COMPLETED"
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  let hasOverdue = false
  let hasDueToday = false

  for (const step of steps) {
    if (step.isCompleted) continue

    if (step.dueDate) {
      const dueDate = new Date(step.dueDate)
      if (dueDate < todayStart) {
        hasOverdue = true
      } else if (dueDate >= todayStart && dueDate <= todayEnd) {
        hasDueToday = true
      }
    }
  }

  if (hasOverdue) {
    return "OVERDUE"
  }
  if (hasDueToday) {
    return "DUE_TODAY"
  }
  return "ON_TRACK"
}

export default function PlansPage() {
  const { plans } = usePlanSummaries()
  const recentlyOpenedPlans = useRecentlyOpenedPlans(plans)
  const { state } = useSidebar()
  const [activeTab, setActiveTab] = React.useState<"ALL" | "OVERDUE" | "DUE_TODAY" | "ON_TRACK" | "COMPLETED">("ALL")

  const handleDeletePlan = async (plan: RecentlyOpenedPlan) => {
    const planTitle = plan.title.trim() || "Untitled Plan"
    const shouldDelete = window.confirm(`Delete "${planTitle}"?`)

    if (!shouldDelete) {
      return
    }

    await deletePlan(plan.id)
  }

  const countAll = recentlyOpenedPlans.length
  const countOverdue = recentlyOpenedPlans.filter(p => getPlanCategory(p) === "OVERDUE").length
  const countDueToday = recentlyOpenedPlans.filter(p => getPlanCategory(p) === "DUE_TODAY").length
  const countOnTrack = recentlyOpenedPlans.filter(p => getPlanCategory(p) === "ON_TRACK").length
  const countCompleted = recentlyOpenedPlans.filter(p => getPlanCategory(p) === "COMPLETED").length

  const filteredPlans = recentlyOpenedPlans.filter(p => {
    if (activeTab === "ALL") return true
    return getPlanCategory(p) === activeTab
  })

  const tabs = [
    { id: "ALL", label: "All Plans", count: countAll },
    { id: "OVERDUE", label: "Overdue", count: countOverdue },
    { id: "DUE_TODAY", label: "Due Today", count: countDueToday },
    { id: "ON_TRACK", label: "On Track", count: countOnTrack },
    { id: "COMPLETED", label: "Completed", count: countCompleted },
  ]

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-between px-3">
        <SidebarTrigger
          className={`${state == "expanded" && "pointer-events-none hidden opacity-0"} transition-all`}
        />
        <Button variant="ghost" size="sm" render={<Link href="/app" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Home
        </Button>
        <Show when="signed-out">
          <RedirectToSignIn />
        </Show>
      </header>

      {plans.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="mb-5 flex items-center gap-3">
            <ListCheckIcon
              className="size-5 shrink-0 text-primary"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                All plans
              </h1>
              <p className="text-sm text-muted-foreground">
                Sorted by recently opened
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                    isActive
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px]",
                      isActive
                        ? "bg-background text-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {filteredPlans.length > 0 ? (
            <PlanGrid plans={filteredPlans} onDeletePlan={handleDeletePlan} />
          ) : (
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
              <InboxIcon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No plans found</p>
              <p className="mt-1 text-xs">
                There are no plans categorized under "{tabs.find((t) => t.id === activeTab)?.label}".
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
          <InboxIcon className="size-10" strokeWidth={1.25} />
          <div>
            <h1 className="font-medium">You don't have any saved plans yet</h1>
            <p>Create a plan to see it here.</p>
          </div>
        </section>
      )}
    </main>
  )
}
