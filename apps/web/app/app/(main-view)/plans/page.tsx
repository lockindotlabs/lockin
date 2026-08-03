"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { InboxIcon } from "lucide-react"
import Link from "next/link"

import { AppPageShell } from "@/components/app-page-shell"
import { PlanGrid, type RecentlyOpenedPlan } from "@/components/plan-grid"
import { deletePlan } from "@/lib/plans/plan-repository"
import { useRecentlyOpenedPlans } from "@/lib/plans/recently-opened-plans"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Badge } from "@workspace/ui/components/badge"
import { LayoutGrid01, List, Plus } from "@untitledui/icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Trash2Icon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { buildPlanHref } from "@/lib/routing/plan-url"

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
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  )

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

function getPlanTimestamp(
  plan: RecentlyOpenedPlan,
  t: ReturnType<typeof useTranslation>["t"]
) {
  const timestamp = plan.lastOpenedAt ?? plan.updatedAt

  if (!timestamp) {
    return t("app.plans.recently", { defaultValue: "Recently" })
  }

  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch (e) {
    return t("app.plans.recently", { defaultValue: "Recently" })
  }
}

function getPlanProgress(
  plan: RecentlyOpenedPlan,
  t: ReturnType<typeof useTranslation>["t"]
) {
  const steps = plan.steps || []
  const total = steps.length
  if (total === 0) {
    return t("app.plans.noTasks", { defaultValue: "No tasks" })
  }
  const completed = steps.filter((s) => s.isCompleted).length
  return t("app.plans.taskProgress", {
    completed,
    total,
    defaultValue: `${completed}/${total} tasks`,
  })
}

function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation()

  switch (category) {
    case "OVERDUE":
      return (
        <Badge variant="destructive">
          {t("app.plans.status.overdue", { defaultValue: "Overdue" })}
        </Badge>
      )
    case "DUE_TODAY":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          {t("app.plans.status.dueToday", { defaultValue: "Due Today" })}
        </Badge>
      )
    case "ON_TRACK":
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-100 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          {t("app.plans.status.onTrack", { defaultValue: "On Track" })}
        </Badge>
      )
    case "COMPLETED":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
        >
          {t("app.plans.status.completed", { defaultValue: "Completed" })}
        </Badge>
      )
    default:
      return (
        <Badge variant="outline">
          {t("app.plans.status.onTrack", { defaultValue: "On Track" })}
        </Badge>
      )
  }
}

export default function PlansPage() {
  const { t } = useTranslation()
  const { plans, isLoaded } = usePlanSummaries()
  const recentlyOpenedPlans = useRecentlyOpenedPlans(plans)
  const [activeTab, setActiveTab] = React.useState<
    "ALL" | "OVERDUE" | "DUE_TODAY" | "ON_TRACK" | "COMPLETED"
  >("ALL")
  const [viewMode, setViewMode] = React.useState<"CARD" | "LIST">("CARD")

  const handleDeletePlan = async (plan: RecentlyOpenedPlan) => {
    const planTitle =
      plan.title.trim() ||
      t("app.plan.untitled", { defaultValue: "Untitled Plan" })
    const shouldDelete = window.confirm(
      t("app.confirm.delete", {
        name: planTitle,
        defaultValue: `Delete "${planTitle}"?`,
      })
    )

    if (!shouldDelete) {
      return
    }

    await deletePlan(plan.id)
  }

  const countAll = recentlyOpenedPlans.length
  const countOverdue = recentlyOpenedPlans.filter(
    (p) => getPlanCategory(p) === "OVERDUE"
  ).length
  const countDueToday = recentlyOpenedPlans.filter(
    (p) => getPlanCategory(p) === "DUE_TODAY"
  ).length
  const countOnTrack = recentlyOpenedPlans.filter(
    (p) => getPlanCategory(p) === "ON_TRACK"
  ).length
  const countCompleted = recentlyOpenedPlans.filter(
    (p) => getPlanCategory(p) === "COMPLETED"
  ).length

  const filteredPlans = recentlyOpenedPlans.filter((p) => {
    if (activeTab === "ALL") return true
    return getPlanCategory(p) === activeTab
  })

  const tabs = [
    {
      id: "ALL",
      label: t("app.plans.tabs.all", { defaultValue: "All Plans" }),
      count: countAll,
    },
    {
      id: "OVERDUE",
      label: t("app.plans.status.overdue", { defaultValue: "Overdue" }),
      count: countOverdue,
    },
    {
      id: "DUE_TODAY",
      label: t("app.plans.status.dueToday", { defaultValue: "Due Today" }),
      count: countDueToday,
    },
    {
      id: "ON_TRACK",
      label: t("app.plans.status.onTrack", { defaultValue: "On Track" }),
      count: countOnTrack,
    },
    {
      id: "COMPLETED",
      label: t("app.plans.status.completed", { defaultValue: "Completed" }),
      count: countCompleted,
    },
  ]

  return (
    <AppPageShell>
      {!isLoaded ? (
        <>
          <div className="mb-5 flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-medium tracking-tight">
                {t("app.nav.plans", { defaultValue: "Plans" })}
              </h1>
            </div>
          </div>

          <div className="mb-6 flex justify-between">
            <div className="h-9 w-64 animate-pulse rounded bg-muted" />
            <div className="h-9 w-20 animate-pulse rounded bg-muted" />
          </div>

          {viewMode === "CARD" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          )}
        </>
      ) : plans.length > 0 ? (
        <>
          <div className="mb-5 flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-medium tracking-tight">
                {t("app.nav.plans", { defaultValue: "Plans" })}
              </h1>
            </div>
          </div>

          <div className="flex justify-between">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                if (val) {
                  setActiveTab(val as any)
                }
              }}
              className="mb-6"
            >
              <TabsList
                aria-label={t("app.plans.filterAria", {
                  defaultValue: "Filter plans by status",
                })}
              >
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                    <span>{tab.label}</span>
                    <Badge
                      variant="secondary"
                      className="h-4.5 rounded-full px-1.5 text-[10px] font-semibold"
                    >
                      {tab.count}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Tabs
              value={viewMode}
              onValueChange={(val) => {
                if (val) {
                  setViewMode(val as any)
                }
              }}
            >
              <TabsList
                aria-label={t("app.plans.toggleViewAria", {
                  defaultValue: "Toggle layout view",
                })}
              >
                <TabsTrigger value="CARD">
                  <LayoutGrid01 />
                </TabsTrigger>
                <TabsTrigger value="LIST">
                  <List />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filteredPlans.length > 0 ? (
            viewMode === "CARD" ? (
              <PlanGrid plans={filteredPlans} onDeletePlan={handleDeletePlan} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="*:text-muted-foreground hover:bg-background">
                    <TableHead className="w-[45%]">
                      {t("app.plans.table.planTitle", {
                        defaultValue: "Plan Title",
                      })}
                    </TableHead>
                    <TableHead className="w-[20%]">
                      {t("app.plans.table.status", {
                        defaultValue: "Status",
                      })}
                    </TableHead>
                    <TableHead className="w-[15%]">
                      {t("app.plans.table.tasks", { defaultValue: "Tasks" })}
                    </TableHead>
                    <TableHead className="w-[15%]">
                      {t("app.plans.table.lastOpened", {
                        defaultValue: "Last Opened",
                      })}
                    </TableHead>
                    <TableHead className="w-[5%] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => {
                    const planTitle =
                      plan.title.trim() ||
                      t("app.plan.untitled", {
                        defaultValue: "Untitled Plan",
                      })
                    const category = getPlanCategory(plan)
                    const progress = getPlanProgress(plan, t)
                    const timestamp = getPlanTimestamp(plan, t)

                    return (
                      <>
                        <TableRow
                          key={plan.id}
                          className="group/row transition-none!"
                        >
                          <TableCell className="font-medium">
                            <Link
                              href={buildPlanHref({ planId: plan.id })}
                              className="block truncate py-2 hover:underline"
                            >
                              {planTitle}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <CategoryBadge category={category} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {progress}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {timestamp}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t("app.plans.deleteAria", {
                                name: planTitle,
                                defaultValue: `Delete ${planTitle}`,
                              })}
                              className="opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-destructive"
                              onClick={() => handleDeletePlan(plan)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
              <InboxIcon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">
                {t("app.plans.noPlansFound", {
                  defaultValue: "No plans found",
                })}
              </p>
              <p className="mt-1 text-xs">
                {t("app.plans.noPlansInCategory", {
                  category: tabs.find((tab) => tab.id === activeTab)?.label,
                  defaultValue: `There are no plans categorized under "${tabs.find((tab) => tab.id === activeTab)?.label}".`,
                })}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
          <InboxIcon className="size-10" strokeWidth={1.25} />
          <div>
            <h1 className="font-medium">
              {t("app.plans.emptyTitle", {
                defaultValue: "You don't have any saved plans yet",
              })}
            </h1>
            <p>
              {t("app.plans.emptyDescription", {
                defaultValue: "Create a plan to see it here.",
              })}
            </p>
            <Button
              className={"mt-4"}
              nativeButton={false}
              render={<Link href="/app/ask" />}
            >
              <Plus data-icon="inline-start" />
              <span>
                {t("app.actions.newPlan", { defaultValue: "New Plan" })}
              </span>
            </Button>
          </div>
        </div>
      )}
    </AppPageShell>
  )
}
