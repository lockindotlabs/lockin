"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { formatDuration } from "@/lib/focus/focus-api"
import { MetricCard } from "@/components/admin/analytics/MetricCard"
import { DistributionDonutChart } from "@/components/admin/analytics/DistributionDonutChart"
import { TimingHeatmap } from "@/components/profile/TimingHeatmap"
import type { MetricCardData } from "@/types/admin-analytics"
import type { MeStatsResponse, SprintInsight } from "@/lib/server/me-stats"

async function fetchMeStats(): Promise<MeStatsResponse | null> {
  try {
    const res = await fetch("/api/me/stats", { cache: "no-store" })
    if (!res.ok) return null
    const { data } = (await res.json()) as { data?: MeStatsResponse }
    return data ?? null
  } catch {
    return null
  }
}

function completionTypeLabel(
  type: SprintInsight["completionType"],
  t: ReturnType<typeof useTranslation>["t"]
) {
  if (type === "NORMAL") {
    return t("app.insights.completion.onTime", { defaultValue: "On time" })
  }
  if (type === "OVERTIME") {
    return t("app.insights.completion.overtime", { defaultValue: "Overtime" })
  }
  if (type === "EARLY") {
    return t("app.insights.completion.endedEarly", {
      defaultValue: "Ended early",
    })
  }
  return "—"
}

function completionTypeClass(type: SprintInsight["completionType"]) {
  if (type === "NORMAL") return "text-emerald-600 dark:text-emerald-400"
  if (type === "OVERTIME") return "text-rose-500"
  return "text-amber-600 dark:text-amber-400"
}

function procrastinationLabel(
  index: number,
  t: ReturnType<typeof useTranslation>["t"]
) {
  if (index === 0) {
    return t("app.insights.procrastination.none", { defaultValue: "None" })
  }
  if (index < 0.4) {
    return t("app.insights.procrastination.mild", { defaultValue: "Mild" })
  }
  if (index < 0.7) {
    return t("app.insights.procrastination.moderate", {
      defaultValue: "Moderate",
    })
  }
  return t("app.insights.procrastination.severe", { defaultValue: "Severe" })
}

export default function InsightsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = React.useState<MeStatsResponse | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    fetchMeStats().then((data) => {
      if (active) {
        setStats(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const metrics: MetricCardData[] = stats
    ? [
        {
          label: t("app.insights.metrics.totalSprints", {
            defaultValue: "Total sprints",
          }),
          value: String(stats.totalSprints),
          icon: "sprintsCompleted",
        },
        {
          label: t("app.insights.metrics.onTimeRate", {
            defaultValue: "On-time rate",
          }),
          value: `${Math.round(stats.onTimeRate)}%`,
          description: t("app.insights.metrics.onTimeRateDescription", {
            defaultValue: ">2 time extensions on a task fails that sprint",
          }),
          icon: "completionRate",
        },
        {
          label: t("app.insights.metrics.totalFocusTime", {
            defaultValue: "Total focus time",
          }),
          value: formatDuration(stats.totalFocusSeconds),
          icon: "focusDuration",
        },
        {
          label: t("app.insights.metrics.avgProcrastination", {
            defaultValue: "Avg. procrastination",
          }),
          value: procrastinationLabel(stats.averageProcrastinationIndex, t),
          description: `${Math.round(stats.averageProcrastinationIndex * 100)}/100`,
          icon: "averageSprintDuration",
        },
      ]
    : []

  const completionTypeBreakdown = React.useMemo(
    () =>
      (stats?.completionTypeBreakdown ?? []).map((point) => ({
        ...point,
        name:
          point.key === "NORMAL" ||
          point.key === "OVERTIME" ||
          point.key === "EARLY"
            ? completionTypeLabel(point.key, t)
            : point.name,
      })),
    [stats?.completionTypeBreakdown, t]
  )

  return (
    <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
      <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
        <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-16">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">
          {t("app.insights.title", { defaultValue: "Insights" })}
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {t("app.insights.subtitle", {
            defaultValue:
              "How your sprints actually went - completion, timing, and procrastination.",
          })}
        </p>

        {loading && (
          <div className="text-sm text-muted-foreground">
            {t("app.common.loading", { defaultValue: "Loading..." })}
          </div>
        )}

        {!loading && stats && stats.totalSprints === 0 && (
          <div className="rounded-xl border border-border/70 bg-background/50 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("app.insights.empty", {
              defaultValue:
                "No completed sprints yet - finish a focus sprint to see your stats here.",
            })}
          </div>
        )}

        {!loading && stats && stats.totalSprints > 0 && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>

            {completionTypeBreakdown.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  {t("app.insights.sections.completionBreakdown", {
                    defaultValue: "Completion breakdown",
                  })}
                </h2>
                <DistributionDonutChart
                  data={completionTypeBreakdown}
                  ariaLabel={t("app.insights.aria.completionBreakdown", {
                    defaultValue: "Sprint completion breakdown",
                  })}
                />
              </div>
            )}

            <div className="mb-8">
              <h2 className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {t("app.insights.sections.whenYouFocus", {
                  defaultValue: "When you focus",
                })}
              </h2>
              <TimingHeatmap
                cells={stats.heatmap}
                maxVolume={stats.maxHeatmapVolume}
              />
              <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span
                    className="size-2.5 rounded-[2px]"
                    style={{ background: "rgba(16, 185, 129, 0.8)" }}
                  />
                  {t("app.insights.completion.onTime", {
                    defaultValue: "On time",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="size-2.5 rounded-[2px]"
                    style={{ background: "rgba(245, 158, 11, 0.8)" }}
                  />
                  {t("app.insights.completion.completedLate", {
                    defaultValue: "Completed late",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="size-2.5 rounded-[2px]"
                    style={{ background: "rgba(244, 63, 94, 0.8)" }}
                  />
                  {t("app.insights.completion.notOnTime", {
                    defaultValue: "Not on time",
                  })}
                </span>
              </div>
            </div>

            <h2 className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {t("app.insights.sections.recentSprints", {
                defaultValue: "Recent sprints",
              })}
            </h2>
            <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background/50 shadow-sm">
              {stats.sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {sprint.planName ??
                        t("app.insights.sprintFallback", {
                          defaultValue: "Sprint",
                        })}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(sprint.startedAt).toLocaleString()} ·{" "}
                      {t("app.insights.stepsProgress", {
                        done: sprint.doneCount,
                        total: sprint.totalSteps,
                        defaultValue: `${sprint.doneCount}/${sprint.totalSteps} steps`,
                      })}{" "}
                      ·{" "}
                      {sprint.duration != null
                        ? formatDuration(sprint.duration)
                        : "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-xs font-semibold ${completionTypeClass(sprint.completionType)}`}
                    >
                      {completionTypeLabel(sprint.completionType, t)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {sprint.sprintOnTime
                        ? t("app.insights.completion.onTime", {
                            defaultValue: "On time",
                          })
                        : t("app.insights.completion.notOnTime", {
                            defaultValue: "Not on time",
                          })}{" "}
                      ·{" "}
                      {t("app.insights.procrastination.label", {
                        value: procrastinationLabel(
                          sprint.procrastinationIndex,
                          t
                        ),
                        defaultValue: `${procrastinationLabel(
                          sprint.procrastinationIndex,
                          t
                        )} procrastination`,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  )
}
