"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  GoalIcon,
  PlayIcon,
  ClockIcon,
  CheckCircle2Icon,
  CircleIcon,
  ZapIcon,
  TimerIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  fetchPlans,
  fetchFocusSessions,
  fetchPlanWithSteps,
  startFocusSession,
  incompleteSteps,
  effortTodaySeconds,
  formatDuration,
  formatMinutes,
  isToday,
  type FocusPlan,
  type PlanStep,
  type FocusSession,
} from "@/lib/focus/focus-api"
import { notifyExtensionSessionStarted } from "@/lib/focus/extension-bridge"
import DurationMismatchNotice from "./DurationMismatchNotice"

function getPlanCategory(plan: FocusPlan) {
  const steps = plan.steps || []
  if (
    plan.status === "COMPLETED" ||
    plan.status === "CANCELLED" ||
    (steps.length > 0 &&
      steps.every((s) => s.status === "DONE" || s.status === "CANCELLED"))
  ) {
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
    if (step.status === "DONE" || step.status === "CANCELLED") continue

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

// ─── Duration presets ─────────────────────────────────────────────────────────

const DURATION_PRESETS = [
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
  { label: "90m", seconds: 90 * 60 },
]

// ─── Sprint Setup Modal ───────────────────────────────────────────────────────

function SprintSetupModal({
  plan,
  steps,
  onStart,
  onClose,
  loading,
}: {
  plan: FocusPlan
  steps: PlanStep[]
  onStart: (selectedSteps: PlanStep[], durationSeconds: number) => void
  onClose: () => void
  loading: boolean
}) {
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(steps.map((s) => s.id))
  )
  const [durationSeconds, setDurationSeconds] = React.useState<number | null>(
    null
  )

  const toggleStep = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedSteps = steps.filter((s) => selected.has(s.id))
  const estimatedTotal = selectedSteps.reduce(
    (sum, s) => sum + (s.estimatedMinutes ?? 0),
    0
  )
  const estimatedSeconds = estimatedTotal * 60
  const chosenDuration = durationSeconds ?? (estimatedSeconds || 25 * 60)

  // Drops the longest-estimated selected step — the quick "shrink to fit" action
  // offered when the chosen sprint is significantly shorter than the total
  // estimate of the steps the user picked (see DurationMismatchNotice).
  const trimLargestSelectedStep = () => {
    const largest = [...selectedSteps].sort(
      (a, b) => (b.estimatedMinutes ?? 0) - (a.estimatedMinutes ?? 0)
    )[0]
    if (largest) toggleStep(largest.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Sprint setup
              </p>
              <h2 className="mt-0.5 text-base font-semibold tracking-tight">
                {plan.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-5 py-4">
          {/* Steps */}
          <div>
            <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Steps to include
            </p>
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No incomplete steps.
              </p>
            ) : (
              <div className="space-y-1">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className="mt-0.5 shrink-0 text-primary">
                      {selected.has(step.id) ? (
                        <CheckCircle2Icon className="size-4" />
                      ) : (
                        <CircleIcon className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="flex-1 text-sm">{step.title}</span>
                    {step.estimatedMinutes > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {step.estimatedMinutes}m
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Duration
            </p>
            {estimatedTotal > 0 && (
              <button
                onClick={() => setDurationSeconds(null)}
                className={`mb-2 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  durationSeconds === null
                    ? "border-primary bg-primary/5 font-medium text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <ZapIcon className="size-3.5" />
                  Estimated · {formatMinutes(estimatedTotal)}
                </span>
                {durationSeconds === null && (
                  <CheckCircle2Icon className="size-4" />
                )}
              </button>
            )}
            <div className="grid grid-cols-4 gap-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.seconds}
                  onClick={() => setDurationSeconds(p.seconds)}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    durationSeconds === p.seconds
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <DurationMismatchNotice
                estimatedSeconds={estimatedSeconds}
                chosenDuration={chosenDuration}
                presets={DURATION_PRESETS}
                selectedStepCount={selectedSteps.length}
                onPickDuration={setDurationSeconds}
                onTrimLargestStep={trimLargestSelectedStep}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border px-5 py-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={selectedSteps.length === 0 || loading}
            onClick={() => onStart(selectedSteps, chosenDuration)}
          >
            <PlayIcon className="size-3.5" />
            {loading ? "Starting…" : "Start Sprint"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Plan Queue Card ──────────────────────────────────────────────────────────

function PlanQueueCard({
  plan,
  onStartSprint,
}: {
  plan: FocusPlan
  onStartSprint: (plan: FocusPlan) => void
}) {
  const incomplete = incompleteSteps(plan.steps ?? [])
  const nextStep = incomplete[0]
  const totalMin = incomplete.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)
  const dueToday = incomplete.filter((s) => isToday(s.dueDate))
  const isCompleted = getPlanCategory(plan) === "COMPLETED"

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border/70 bg-background px-4 py-3.5 transition-colors hover:border-border hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{plan.name}</span>
          {dueToday.length > 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {dueToday.length} due today
            </span>
          )}
          {isCompleted && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              Completed
            </span>
          )}
        </div>
        {nextStep ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Next: {nextStep.title}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground/75 italic">
            All steps completed
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2Icon className="size-3 text-emerald-500" />
            {isCompleted ? (plan.steps?.length ?? 0) : incomplete.length} step
            {isCompleted || incomplete.length !== 1 ? "s" : ""}
          </span>
          {!isCompleted && totalMin > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />~{formatMinutes(totalMin)}
            </span>
          )}
        </div>
      </div>
      {!isCompleted && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onStartSprint(plan)}
        >
          <PlayIcon className="size-3.5" />
          Sprint
        </Button>
      )}
    </div>
  )
}

// ─── Recent Sprint Row ────────────────────────────────────────────────────────

function RecentSprintRow({ session }: { session: FocusSession }) {
  const duration = session.duration ? formatDuration(session.duration) : "—"
  const startedAt = new Date(session.startedAt)
  const completionColor =
    session.completionType === "EARLY"
      ? "text-amber-500"
      : session.completionType === "OVERTIME"
        ? "text-rose-500"
        : "text-emerald-500"

  return (
    <div className="flex items-center gap-3 py-2.5 text-sm">
      <span className={`shrink-0 text-xs font-medium ${completionColor}`}>
        {session.completionType === "EARLY"
          ? "Early"
          : session.completionType === "OVERTIME"
            ? "Overtime"
            : "Done"}
      </span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        {session.plan?.name ?? "Free sprint"}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {isToday(session.startedAt)
          ? startedAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : startedAt.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })}
      </span>
      <span className="shrink-0 font-medium tabular-nums">{duration}</span>
    </div>
  )
}

// ─── Focus Hub ────────────────────────────────────────────────────────────────

export default function FocusPage() {
  const { state } = useSidebar()
  const { getToken } = useAuth()
  const router = useRouter()

  const [plans, setPlans] = React.useState<FocusPlan[]>([])
  const [sessions, setSessions] = React.useState<FocusSession[]>([])
  const [loading, setLoading] = React.useState(true)
  const [setupPlan, setSetupPlan] = React.useState<FocusPlan | null>(null)
  const [setupSteps, setSetupSteps] = React.useState<PlanStep[]>([])
  const [loadingSteps, setLoadingSteps] = React.useState(false)
  const [starting, setStarting] = React.useState(false)

  // Load hub data
  React.useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([fetchPlans(getToken), fetchFocusSessions(getToken)]).then(
      async ([rawPlans, rawSessions]) => {
        if (!active) return

        const withSteps = await Promise.all(
          rawPlans.map((p) =>
            fetchPlanWithSteps(p.id, getToken).then((full) => full ?? p)
          )
        )

        if (!active) return

        const sorted = withSteps.sort((a, b) => {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        })

        setPlans(sorted)
        setSessions(rawSessions)
        setLoading(false)
      }
    )

    return () => {
      active = false
    }
  }, [getToken])

  // Open sprint setup for a plan
  const handleStartSprint = async (plan: FocusPlan) => {
    setLoadingSteps(true)
    setSetupPlan(plan)
    const full = await fetchPlanWithSteps(plan.id, getToken)
    const steps = incompleteSteps(full?.steps ?? plan.steps ?? [])
    setSetupSteps(steps)
    setLoadingSteps(false)
  }

  // Create session and navigate
  const handleConfirmSprint = async (
    selectedSteps: PlanStep[],
    durationSeconds: number
  ) => {
    if (!setupPlan) return
    setStarting(true)

    const session = await startFocusSession(
      {
        planId: setupPlan.id,
        plannedDuration: durationSeconds,
      },
      getToken
    )

    if (session) {
      // Store selected steps in sessionStorage for session page
      sessionStorage.setItem(
        `lockin:session:${session.id}:steps`,
        JSON.stringify(selectedSteps)
      )

      // Push the start event straight to the extension so its HUD/blocking/
      // popup mirror this sprint immediately, instead of only discovering it
      // whenever the popup happens to open and poll the server.
      notifyExtensionSessionStarted({
        sessionId: session.id,
        planId: setupPlan.id,
        taskName: setupPlan.name,
        duration: durationSeconds,
        startTime: new Date(session.startedAt).getTime(),
        tasks: selectedSteps.map((s) => ({
          id: s.id,
          label: s.title,
          done: s.status === "DONE",
          durationMinutes: s.estimatedMinutes,
        })),
      })

      router.push(`/app/focus/session/${session.id}`)
    }

    setStarting(false)
    setSetupPlan(null)
  }

  // Derived data
  const effortSeconds = effortTodaySeconds(sessions)
  const recentSessions = sessions.slice(0, 5)

  const overduePlans = plans.filter((p) => getPlanCategory(p) === "OVERDUE")
  const dueTodayPlans = plans.filter((p) => getPlanCategory(p) === "DUE_TODAY")
  const onTrackPlans = plans.filter((p) => getPlanCategory(p) === "ON_TRACK")
  const completedPlans = plans.filter((p) => getPlanCategory(p) === "COMPLETED")

  return (
    <>
      <main className="flex h-full flex-col overflow-y-scroll bg-background pt-12 text-foreground">
        <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-16">
          {/* Effort Today pill */}
          {effortSeconds > 0 && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TimerIcon className="size-3.5" />
              {formatDuration(effortSeconds)} focused today
            </div>
          )}

          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Focus</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {dueTodayPlans.length > 0
                ? `${dueTodayPlans.length} plan${dueTodayPlans.length !== 1 ? "s" : ""} with steps due today.`
                : "Pick a plan and start a sprint."}
            </p>
          </div>

          {/* Categorized Plans sections */}
          <div className="mb-10 space-y-8">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[72px] rounded-xl" />
                  ))}
                </div>
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <CheckCircle2Icon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">
                  Nothing ready to sprint on
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a plan to get started.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push("/app/plan")}
                >
                  Create a plan
                </Button>
              </div>
            ) : (
              <>
                {overduePlans.length > 0 && (
                  <section>
                    <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-rose-500 uppercase dark:text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Overdue ({overduePlans.length})
                    </h2>
                    <div className="space-y-2">
                      {overduePlans.map((plan) => (
                        <PlanQueueCard
                          key={plan.id}
                          plan={plan}
                          onStartSprint={handleStartSprint}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {dueTodayPlans.length > 0 && (
                  <section>
                    <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-amber-500 uppercase dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Due Today ({dueTodayPlans.length})
                    </h2>
                    <div className="space-y-2">
                      {dueTodayPlans.map((plan) => (
                        <PlanQueueCard
                          key={plan.id}
                          plan={plan}
                          onStartSprint={handleStartSprint}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {onTrackPlans.length > 0 && (
                  <section>
                    <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      On Track ({onTrackPlans.length})
                    </h2>
                    <div className="space-y-2">
                      {onTrackPlans.map((plan) => (
                        <PlanQueueCard
                          key={plan.id}
                          plan={plan}
                          onStartSprint={handleStartSprint}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {completedPlans.length > 0 && (
                  <section>
                    <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-emerald-500 uppercase dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Completed ({completedPlans.length})
                    </h2>
                    <div className="space-y-2">
                      {completedPlans.map((plan) => (
                        <PlanQueueCard
                          key={plan.id}
                          plan={plan}
                          onStartSprint={handleStartSprint}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Recent Sprints */}
          {(recentSessions.length > 0 || !loading) && (
            <section>
              <h2 className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Recent Sprints
              </h2>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sprints yet.</p>
              ) : (
                <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background px-4">
                  {recentSessions.map((s) => (
                    <RecentSprintRow key={s.id} session={s} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sprint Setup Modal */}
        {setupPlan && !loadingSteps && (
          <SprintSetupModal
            plan={setupPlan}
            steps={setupSteps}
            onStart={handleConfirmSprint}
            onClose={() => setSetupPlan(null)}
            loading={starting}
          />
        )}
      </main>
    </>
  )
}
