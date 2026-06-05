"use client"

import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import { ArrowLeftIcon, InboxIcon, ListCheckIcon } from "lucide-react"
import Link from "next/link"

import { PlanGrid, type RecentlyOpenedPlan } from "@/components/plan-grid"
import { deletePlan } from "@/lib/plans/plan-repository"
import { useRecentlyOpenedPlans } from "@/lib/plans/recently-opened-plans"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"

export default function PlansPage() {
  const { plans } = usePlanSummaries()
  const recentlyOpenedPlans = useRecentlyOpenedPlans(plans)
  const { state } = useSidebar()

  const handleDeletePlan = async (plan: RecentlyOpenedPlan) => {
    const planTitle = plan.title.trim() || "Untitled Plan"
    const shouldDelete = window.confirm(`Delete "${planTitle}"?`)

    if (!shouldDelete) {
      return
    }

    await deletePlan(plan.id)
  }

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-between px-3">
        <SidebarTrigger
          className={`${state == "expanded" && "pointer-events-none hidden opacity-0"} transition-all`}
        />

        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/app" />}
        >
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
          <PlanGrid
            plans={recentlyOpenedPlans}
            onDeletePlan={handleDeletePlan}
          />
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
