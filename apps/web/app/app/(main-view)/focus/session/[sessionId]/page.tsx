"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { useSidebar } from "@workspace/ui/components/sidebar"
import {
  CheckCircle2Icon,
  CircleIcon,
  PauseIcon,
  PlayIcon,
  SquareIcon,
  XCircleIcon,
} from "lucide-react"
import {
  fetchFocusSession,
  fetchPlanWithSteps,
  endFocusSession,
  incompleteSteps,
  formatMinutes,
  type FocusSession,
  type FocusPlan,
  type PlanStep,
  type TaskSnapshot,
  type TimingOutcome,
  type TaskFinalAction,
} from "@/lib/focus/focus-api"
import {
  notifyExtensionSessionEnded,
  notifyExtensionSessionPaused,
  notifyExtensionSessionResumed,
  notifyExtensionTasksUpdated,
} from "@/lib/focus/extension-bridge"
import Aurora from "@/components/Aurora"
import { TaskOvertimeModal } from "@/components/focus/TaskOvertimeModal"

// ─── Timer display ────────────────────────────────────────────────────────────

function fmt(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

// Per-task timing/procrastination scoring for the heatmap. >2 "give me more
// time" requests on a task fails that task's timing AND marks the whole
// sprint not-on-time, regardless of whether the task eventually got done.
function computeTimingOutcome(
  estimatedMinutes: number,
  actualSpentSeconds: number,
  extensionCount: number,
  finalAction: TaskFinalAction
): TimingOutcome {
  if (finalAction === "GAVE_UP") return "GAVE_UP"
  if (extensionCount === 0) {
    const estimatedSec = estimatedMinutes * 60
    if (estimatedSec <= 0) return "ON_TIME"
    const ratio = actualSpentSeconds / estimatedSec
    if (ratio < 0.8) return "EARLY"
    if (ratio <= 1.0) return "ON_TIME"
    return "OVERTIME_RESOLVED" // went over but got done before asking for time
  }
  return extensionCount <= 2 ? "OVERTIME_RESOLVED" : "OVERTIME_FAILED"
}

// 0 = no procrastination, 1 = severe (gave up, or way over with many extensions).
function computeProcrastinationScore(
  estimatedMinutes: number,
  actualSpentSeconds: number,
  extensionCount: number,
  finalAction: TaskFinalAction
): number {
  if (finalAction === "GAVE_UP") return 1
  if (extensionCount === 0) return 0
  const estimatedSec = estimatedMinutes * 60
  const overtimeRatio =
    estimatedSec > 0
      ? Math.max(0, actualSpentSeconds - estimatedSec) / estimatedSec
      : 0
  const extensionFactor = Math.min(extensionCount / 3, 1) // hits 1.0 at the 3rd request — same threshold as OVERTIME_FAILED
  return Math.min(1, extensionFactor * 0.6 + Math.min(overtimeRatio, 1) * 0.4)
}

function computeCompletionType(
  allDone: boolean,
  sprintOnTime: boolean
): "EARLY" | "NORMAL" | "OVERTIME" {
  if (allDone && sprintOnTime) return "NORMAL"
  if (allDone && !sprintOnTime) return "OVERTIME"
  return "EARLY"
}

// Shared by the end-sprint summary modal and the Scenario B end-of-timer
// actions — derives spent/remaining time per step from when each was ticked.
function computeStepDetails(
  steps: PlanStep[],
  completedIds: Set<string>,
  taskCheckTimes: Record<string, number>,
  elapsed: number
): Record<string, { spentSeconds: number; remainingMinutes: number }> {
  const res: Record<string, { spentSeconds: number; remainingMinutes: number }> = {}
  let previousCompletionTime = 0

  for (const s of steps) {
    const done = completedIds.has(s.id)
    const originalEstimateSeconds = (s.estimatedMinutes ?? 0) * 60

    let spentSeconds = 0
    if (done) {
      const recordedTime = taskCheckTimes[s.id]
      if (recordedTime !== undefined) {
        spentSeconds = Math.max(0, recordedTime - previousCompletionTime)
        previousCompletionTime = Math.max(previousCompletionTime, recordedTime)
      } else {
        const potentialSpent = Math.max(0, elapsed - previousCompletionTime)
        spentSeconds = Math.min(originalEstimateSeconds, potentialSpent)
        previousCompletionTime += spentSeconds
      }
    } else {
      const remainingElapsed = Math.max(0, elapsed - previousCompletionTime)
      spentSeconds = remainingElapsed
      previousCompletionTime = elapsed
    }

    const remainingEstimateSeconds = Math.max(
      0,
      originalEstimateSeconds - spentSeconds
    )
    const remainingMinutes =
      remainingEstimateSeconds > 0
        ? Math.max(1, Math.round(remainingEstimateSeconds / 60))
        : 0

    res[s.id] = {
      spentSeconds,
      remainingMinutes: done ? s.estimatedMinutes : remainingMinutes,
    }
  }
  return res
}

// ─── End Sprint Checklist Modal ──────────────────────────────────────────────

// Ending while there's still time and/or unfinished steps is a deliberate
// commitment break — every incomplete step must be explicitly resolved as
// "I'm done" (trusted, no penalty) or "I haven't" (counts as given up,
// scored as procrastination) before the End button unlocks. No silent
// free-toggle escape hatch.
function EndSprintSummaryModal({
  steps,
  completedIds,
  perTaskFinalAction,
  perTaskExtensions,
  stepDetails,
  elapsed,
  isOvertime,
  remaining,
  onClose,
  onMarkDone,
  onGiveUp,
  onConfirmEnd,
  ending,
}: {
  steps: PlanStep[]
  completedIds: Set<string>
  perTaskFinalAction: Record<string, TaskFinalAction>
  perTaskExtensions: Record<string, { count: number; totalSeconds: number }>
  stepDetails: Record<
    string,
    { spentSeconds: number; remainingMinutes: number }
  >
  elapsed: number
  isOvertime: boolean
  remaining: number
  onClose: () => void
  onMarkDone: (id: string) => void
  onGiveUp: (id: string) => void
  onConfirmEnd: () => void
  ending: boolean
}) {
  const hasIncomplete = steps.some((s) => !completedIds.has(s.id))
  const unresolvedCount = steps.filter(
    (s) => !completedIds.has(s.id) && !perTaskFinalAction[s.id]
  ).length
  const canEnd = unresolvedCount === 0
  const isTooEarly = remaining > 0 && hasIncomplete

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/70 bg-background/95 p-6 text-foreground shadow-2xl backdrop-blur-lg">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          End Focus Sprint
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Resolve every unfinished step below before you can end.
        </p>

        {/* Warning if there are incomplete steps */}
        {hasIncomplete && (
          <div className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
            <p className="flex items-center gap-1.5 font-semibold">
              <span>⚠️</span>{" "}
              {isTooEarly
                ? "You're ending this sprint too early!"
                : "You haven't finished everything yet!"}
            </p>
            <p className="leading-relaxed">
              {isTooEarly
                ? 'There\'s still time left and unfinished steps. Resolve each one below — "I\'m done" or "I haven\'t" — or continue the sprint.'
                : "Resolve the remaining steps below before ending."}
            </p>
          </div>
        )}

        {/* Step checklist */}
        <div className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
          {steps.map((step) => {
            const done = completedIds.has(step.id)
            const gaveUp = perTaskFinalAction[step.id] === "GAVE_UP"
            const detail = stepDetails[step.id]
            const remainingMin = detail
              ? detail.remainingMinutes
              : step.estimatedMinutes
            const spentSec = detail ? detail.spentSeconds : 0
            const extension = perTaskExtensions[step.id]

            if (done) {
              return (
                <div
                  key={step.id}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5"
                >
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground line-through">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      Completed
                    </p>
                  </div>
                </div>
              )
            }

            if (gaveUp) {
              return (
                <div
                  key={step.id}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5 opacity-70"
                >
                  <XCircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                      Marked as not done
                    </p>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={step.id}
                className="rounded-lg border border-amber-300/60 bg-amber-50/50 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/10"
              >
                <div className="flex items-start gap-3">
                  <CircleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Estimate:{" "}
                      <strong className="text-foreground">
                        {remainingMin}m
                      </strong>
                      {spentSec > 0 &&
                        ` (spent ${Math.round(spentSec / 60)}m)`}
                      {extension && extension.count > 0 && (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">
                          · asked for +{Math.round(extension.totalSeconds / 60)}
                          m more ({extension.count}x)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onGiveUp(step.id)}
                  >
                    I haven't
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                    onClick={() => onMarkDone(step.id)}
                  >
                    I'm done
                  </Button>
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground/80">
                  You're responsible for your own actions — be honest about what's actually done.
                </p>
              </div>
            )
          })}
        </div>

        {/* Sprint Summary Details */}
        <div className="mt-5 space-y-2 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Time elapsed:</span>
            <span className="font-semibold text-foreground">
              {fmt(elapsed)}
            </span>
          </div>
          {!isOvertime && remaining > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Remaining sprint time:</span>
              <span className="font-semibold text-rose-500">
                {fmt(remaining)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 transition-colors ${
              hasIncomplete
                ? "border-amber-400 font-semibold text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                : ""
            }`}
            onClick={onClose}
            disabled={ending}
          >
            {hasIncomplete ? "Continue Sprint" : "Cancel"}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onConfirmEnd}
            disabled={ending || !canEnd}
            title={
              !canEnd
                ? `Resolve ${unresolvedCount} more step(s) first`
                : undefined
            }
          >
            {ending
              ? "Ending..."
              : canEnd
                ? "Save & End"
                : `Resolve ${unresolvedCount} more`}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useTimer(
  sessionId: string,
  plannedDuration: number,
  paused: boolean,
  overtime: boolean,
  startedAt: string | null
) {
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef<number>(Date.now())
  const pausedSecsRef = React.useRef<number>(0)
  const pausedAtRef = React.useRef<number | null>(null)

  // Sync startRef to server startedAt when session loads (persists across reloads)
  React.useEffect(() => {
    if (!startedAt) return
    const ms = new Date(startedAt).getTime()
    startRef.current = ms

    const storedPausedSecs = localStorage.getItem(`lockin:session:${sessionId}:pausedSecs`)
    const parsedPausedSecs = storedPausedSecs ? parseInt(storedPausedSecs, 10) : 0
    pausedSecsRef.current = parsedPausedSecs

    const storedPausedAt = localStorage.getItem(`lockin:session:${sessionId}:pausedAt`)
    const parsedPausedAt = storedPausedAt ? parseInt(storedPausedAt, 10) : null
    pausedAtRef.current = parsedPausedAt

    let currentPausedSecs = parsedPausedSecs
    if (parsedPausedAt !== null) {
      currentPausedSecs += Math.floor((Date.now() - parsedPausedAt) / 1000)
    }

    setElapsed(Math.max(0, Math.floor((Date.now() - ms) / 1000) - currentPausedSecs))
  }, [startedAt, sessionId])

  React.useEffect(() => {
    if (paused) {
      if (pausedAtRef.current === null) {
        pausedAtRef.current = Date.now()
        localStorage.setItem(`lockin:session:${sessionId}:pausedAt`, String(pausedAtRef.current))
      }
      return
    }
    if (pausedAtRef.current !== null) {
      pausedSecsRef.current += Math.floor(
        (Date.now() - pausedAtRef.current) / 1000
      )
      localStorage.setItem(`lockin:session:${sessionId}:pausedSecs`, String(pausedSecsRef.current))
      pausedAtRef.current = null
      localStorage.removeItem(`lockin:session:${sessionId}:pausedAt`)
    }

    const id = setInterval(() => {
      const raw =
        Math.floor((Date.now() - startRef.current) / 1000) -
        pausedSecsRef.current
      setElapsed(Math.max(0, raw))
    }, 500)

    return () => clearInterval(id)
  }, [paused, sessionId])

  const remaining = Math.max(0, plannedDuration - elapsed)
  const isOvertime = overtime || remaining <= 0
  const pct = Math.min(100, Math.round((elapsed / plannedDuration) * 100))

  return {
    elapsed,
    remaining,
    isOvertime,
    pct,
    pausedSecs: pausedSecsRef.current,
  }
}

// ─── Session Page ─────────────────────────────────────────────────────────────

export default function SessionPage() {
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { getToken } = useAuth()
  const sessionId = params.sessionId

  // Auto-collapse the sidebar while focusing — restore whatever it was set
  // to before, on the way out, rather than always forcing it back open
  // (the user may have already had it closed).
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()
  const sidebarOpenBeforeFocusRef = React.useRef(sidebarOpen)
  React.useEffect(() => {
    setSidebarOpen(false)
    return () => {
      setSidebarOpen(sidebarOpenBeforeFocusRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [session, setSession] = React.useState<FocusSession | null>(null)
  const [plan, setPlan] = React.useState<FocusPlan | null>(null)
  const [steps, setSteps] = React.useState<PlanStep[]>([])

  const [completedIds, setCompletedIds] = React.useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`lockin:session:${sessionId}:completedIds`)
      if (stored) {
        try {
          return new Set(JSON.parse(stored))
        } catch {}
      }
    }
    return new Set()
  })

  const [taskCheckTimes, setTaskCheckTimes] = React.useState<
    Record<string, number>
  >(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`lockin:session:${sessionId}:taskCheckTimes`)
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {}
      }
    }
    return {}
  })

  const [taskSavedSeconds, setTaskSavedSeconds] = React.useState<
    Record<string, number>
  >({})
  // Completion/give-up timestamp per task, used for the heatmap.
  const [taskCompletedAt, setTaskCompletedAt] = React.useState<
    Record<string, string>
  >({})
  // "Give me more time" usage per task — drives both the timing outcome and
  // whether the whole sprint counts as on-time (>2 requests on any one task
  // fails the sprint, per the commitment rule).
  const [perTaskExtensions, setPerTaskExtensions] = React.useState<
    Record<string, { count: number; totalSeconds: number }>
  >({})
  // How a task's overtime modal was resolved — DONE or GAVE_UP. Once set to
  // GAVE_UP a task can't be reopened via the checklist.
  const [perTaskFinalAction, setPerTaskFinalAction] = React.useState<
    Record<string, TaskFinalAction>
  >({})
  // Which task's overtime modal is currently showing (mid-sprint mode).
  const [activeOvertimeTaskId, setActiveOvertimeTaskId] = React.useState<
    string | null
  >(null)
  const [loading, setLoading] = React.useState(true)

  const [paused, setPaused] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`lockin:session:${sessionId}:paused`)
      return stored === "true"
    }
    return false
  })

  const [overtime, setOvertime] = React.useState(false)
  const [ending, setEnding] = React.useState(false)
  const [showEndSprintSummary, setShowEndSprintSummary] = React.useState(false)
  const [showSprintEndChecklist, setShowSprintEndChecklist] =
    React.useState(false)

  const [addedSeconds, setAddedSeconds] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`lockin:session:${sessionId}:addedSeconds`)
      if (stored) {
        try {
          return parseInt(stored, 10) || 0
        } catch {}
      }
    }
    return 0
  })

  const [particles, setParticles] = React.useState<
    {
      id: number
      x: number
      y: number
      color: string
      angle: number
      speed: number
    }[]
  >([])

  const plannedDuration = session?.plannedDuration ?? 25 * 60

  const totalSavedSeconds = React.useMemo(() => {
    let saved = 0
    let lastCompletionTime = 0
    const sortedCompletedSteps = steps
      .filter((s) => completedIds.has(s.id))
      .sort((a, b) => (taskCheckTimes[a.id] ?? 0) - (taskCheckTimes[b.id] ?? 0))

    for (const s of sortedCompletedSteps) {
      const checkTime = taskCheckTimes[s.id] ?? 0
      const spent = Math.max(0, checkTime - lastCompletionTime)
      const estimateSec = (s.estimatedMinutes ?? 0) * 60
      saved += Math.max(0, estimateSec - spent)
      lastCompletionTime = checkTime
    }
    return saved
  }, [completedIds, steps, taskCheckTimes])

  const adjustedDuration = Math.max(
    0,
    plannedDuration + addedSeconds - totalSavedSeconds
  )
  const { elapsed, remaining, isOvertime, pct } = useTimer(
    sessionId,
    adjustedDuration,
    paused,
    overtime,
    session?.startedAt ?? null
  )

  // A task once given up can't be reopened via the checklist — skip it when
  // picking the "current" (first pending) step.
  const isStepPending = (s: PlanStep) =>
    !completedIds.has(s.id) && perTaskFinalAction[s.id] !== "GAVE_UP"
  const currentStepIndex = steps.findIndex(isStepPending)
  const currentStep = steps[currentStepIndex]

  const stepDetails = computeStepDetails(steps, completedIds, taskCheckTimes, elapsed)
  const unresolvedSteps = steps.filter(
    (s) => !completedIds.has(s.id) && !perTaskFinalAction[s.id]
  )

  const [lastCompletedCount, setLastCompletedCount] = React.useState(0)
  const [triggerAnimate, setTriggerAnimate] = React.useState(false)

  const triggerFireworks = React.useCallback(() => {
    const newParticles = []
    const colors = [
      "#F97316",
      "#EAB308",
      "#3B82F6",
      "#10B981",
      "#EC4899",
      "#8B5CF6",
    ]
    for (let i = 0; i < 65; i++) {
      newParticles.push({
        id: Math.random(),
        x: 0,
        y: 0,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        angle: Math.random() * 2 * Math.PI,
        speed: 3 + Math.random() * 8,
      })
    }
    setParticles(newParticles)
    setTimeout(() => {
      setParticles([])
    }, 1200)
  }, [])

  React.useEffect(() => {
    const count = completedIds.size
    if (count > lastCompletedCount) {
      setTriggerAnimate(true)
      triggerFireworks()
      const timer = setTimeout(() => setTriggerAnimate(false), 1000)
      return () => clearTimeout(timer)
    }
    setLastCompletedCount(count)
  }, [completedIds.size, lastCompletedCount, triggerFireworks])

  // Sync tasks and remaining time to extension when completedIds changes
  React.useEffect(() => {
    if (!steps.length || loading) return
    notifyExtensionTasksUpdated(
      steps.map((step) => ({
        id: step.id,
        label: step.title,
        done: completedIds.has(step.id),
        durationMinutes: step.estimatedMinutes,
      })),
      remaining
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedIds])

  // Trigger overtime when timer hits 0
  React.useEffect(() => {
    if (remaining <= 0 && !overtime && session) {
      setOvertime(true)
    }
  }, [remaining, overtime, session])

  // Per-task overtime — fires while the CURRENT step alone runs past its own
  // estimate (plus any extensions already granted), independent of the
  // sprint's total remaining time. Suppressed once the sprint-end checklist
  // takes over (total time is up) so only one modal is ever active.
  React.useEffect(() => {
    if (loading || showSprintEndChecklist || remaining <= 0) return
    if (!currentStep || currentStep.estimatedMinutes <= 0) return
    if (perTaskFinalAction[currentStep.id]) return
    if (activeOvertimeTaskId === currentStep.id) return

    const spent = stepDetails[currentStep.id]?.spentSeconds ?? 0
    const allowedSec =
      currentStep.estimatedMinutes * 60 +
      (perTaskExtensions[currentStep.id]?.totalSeconds ?? 0)

    if (spent > allowedSec) {
      setActiveOvertimeTaskId(currentStep.id)
    }
  }, [
    loading,
    showSprintEndChecklist,
    remaining,
    currentStep,
    perTaskFinalAction,
    perTaskExtensions,
    activeOvertimeTaskId,
    stepDetails,
  ])

  // Sprint's total time is up — switch from per-task popups to a checklist
  // covering every step that's still neither done nor given up. No "just
  // leave" exit: each one must be resolved via the same 3-action modal.
  React.useEffect(() => {
    if (
      remaining <= 0 &&
      loading === false &&
      unresolvedSteps.length > 0 &&
      !showSprintEndChecklist
    ) {
      setActiveOvertimeTaskId(null)
      setShowSprintEndChecklist(true)
    }
  }, [remaining, loading, unresolvedSteps.length, showSprintEndChecklist])

  // Once every step in the sprint-end checklist has been resolved (done or
  // given up), finalize and leave automatically — there's nothing left to ask.
  React.useEffect(() => {
    if (!showSprintEndChecklist || unresolvedSteps.length > 0) return
    const sprintOnTime = steps.every(
      (s) => (perTaskExtensions[s.id]?.count ?? 0) <= 2
    )
    const allDoneNow = steps.every((s) => completedIds.has(s.id))
    const completionType = computeCompletionType(allDoneNow, sprintOnTime)
    const details = computeStepDetails(steps, completedIds, taskCheckTimes, elapsed)
    handleEnd(completionType, completedIds, details, "/app/focus")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSprintEndChecklist, unresolvedSteps.length])

  const handleGiveUp = (stepId: string) => {
    setPerTaskFinalAction((prev) => ({ ...prev, [stepId]: "GAVE_UP" }))
    setTaskCompletedAt((prev) => ({ ...prev, [stepId]: new Date().toISOString() }))
    setActiveOvertimeTaskId(null)
  }

  const handleGiveMoreTime = (stepId: string, minutes: number) => {
    setPerTaskExtensions((prev) => ({
      ...prev,
      [stepId]: {
        count: (prev[stepId]?.count ?? 0) + 1,
        totalSeconds: (prev[stepId]?.totalSeconds ?? 0) + minutes * 60,
      },
    }))
    // Extensions feed the main timer too — the sprint clock actually grows,
    // while the per-task overtime sub-timer keeps tracking that one step.
    setAddedSeconds((prev) => prev + minutes * 60)
    setActiveOvertimeTaskId(null)
    setShowSprintEndChecklist(false)
  }

  const handleMarkTaskDone = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId)
    if (!step) return
    setCompletedIds((prev) => new Set(prev).add(stepId))
    setTaskCheckTimes((prev) => ({ ...prev, [stepId]: elapsed }))
    setPerTaskFinalAction((prev) => ({ ...prev, [stepId]: "DONE" }))
    setTaskCompletedAt((prev) => ({ ...prev, [stepId]: new Date().toISOString() }))
    setActiveOvertimeTaskId(null)
  }

  // Sync state to localStorage
  React.useEffect(() => {
    if (!sessionId) return
    localStorage.setItem(`lockin:session:${sessionId}:completedIds`, JSON.stringify(Array.from(completedIds)))
  }, [completedIds, sessionId])

  React.useEffect(() => {
    if (!sessionId) return
    localStorage.setItem(`lockin:session:${sessionId}:taskCheckTimes`, JSON.stringify(taskCheckTimes))
  }, [taskCheckTimes, sessionId])

  React.useEffect(() => {
    if (!sessionId) return
    localStorage.setItem(`lockin:session:${sessionId}:addedSeconds`, String(addedSeconds))
  }, [addedSeconds, sessionId])

  React.useEffect(() => {
    if (!sessionId) return
    localStorage.setItem(`lockin:session:${sessionId}:paused`, String(paused))
  }, [paused, sessionId])

  // Track elapsed in a ref so event listener doesn't need to re-bind
  const elapsedRef = React.useRef(elapsed)
  React.useEffect(() => {
    elapsedRef.current = elapsed
  }, [elapsed])

  // Listen for task changes made inside the Chrome Extension
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleExtensionSprintChanged = (e: Event) => {
      const customEvent = e as CustomEvent
      const extensionSprint = customEvent.detail?.sprint
      if (!extensionSprint?.active) return

      const extensionTasks = extensionSprint.tasks || []
      const newCompletedIds = new Set<string>()

      extensionTasks.forEach((t: { id?: string; done: boolean }) => {
        if (t.id && t.done) {
          newCompletedIds.add(t.id)
        }
      })

      // Update completedIds with loop guard
      setCompletedIds((prev) => {
        const changed =
          prev.size !== newCompletedIds.size ||
          Array.from(prev).some((id) => !newCompletedIds.has(id))

        if (changed) {
          // Sync check times based on difference
          setTaskCheckTimes((prevTimes) => {
            const nextTimes = { ...prevTimes }
            newCompletedIds.forEach((id) => {
              if (!prev.has(id)) {
                nextTimes[id] = elapsedRef.current
              }
            })
            prev.forEach((id) => {
              if (!newCompletedIds.has(id)) {
                delete nextTimes[id]
              }
            })
            return nextTimes
          })
          return newCompletedIds
        }
        return prev
      })
    }

    window.addEventListener("lockin-extension-sprint-changed", handleExtensionSprintChanged)
    return () => {
      window.removeEventListener("lockin-extension-sprint-changed", handleExtensionSprintChanged)
    }
  }, [])

  // Add beforeunload exit warning when the sprint is active and loading is finished
  React.useEffect(() => {
    if (loading || ending) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Are you sure you want to leave? Your active sprint is in progress."
      return e.returnValue
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [loading, ending])

  // Load session + plan data
  React.useEffect(() => {
    if (!sessionId) return
    let active = true

    const load = async () => {
      const s = await fetchFocusSession(sessionId, getToken)
      if (!active || !s) return
      if (s.endedAt) {
        // Clean up any stale localStorage keys for this session
        localStorage.removeItem(`lockin:session:${sessionId}:completedIds`)
        localStorage.removeItem(`lockin:session:${sessionId}:taskCheckTimes`)
        localStorage.removeItem(`lockin:session:${sessionId}:addedSeconds`)
        localStorage.removeItem(`lockin:session:${sessionId}:paused`)
        localStorage.removeItem(`lockin:session:${sessionId}:pausedSecs`)
        localStorage.removeItem(`lockin:session:${sessionId}:pausedAt`)
        localStorage.removeItem(`lockin:session:${sessionId}:steps`)
        if (localStorage.getItem("lockin:active_session_id") === sessionId) {
          localStorage.removeItem("lockin:active_session_id")
        }
        router.push("/app/focus")
        return
      }
      setSession(s)

      // Try sessionStorage first, then fallback to localStorage
      const storedSession = sessionStorage.getItem(`lockin:session:${sessionId}:steps`)
      const storedLocal = localStorage.getItem(`lockin:session:${sessionId}:steps`)
      const stored = storedSession || storedLocal
      if (stored) {
        try {
          const parsed: PlanStep[] = JSON.parse(stored)
          setSteps(parsed)
          if (!storedLocal) {
            localStorage.setItem(`lockin:session:${sessionId}:steps`, stored)
          }
          setLoading(false)
          return
        } catch {}
      }

      // Fallback: fetch plan steps
      if (s.planId) {
        const p = await fetchPlanWithSteps(s.planId, getToken)
        if (!active) return
        setPlan(p)
        const activeSteps = incompleteSteps(p?.steps ?? [])
        setSteps(activeSteps)
        localStorage.setItem(`lockin:session:${sessionId}:steps`, JSON.stringify(activeSteps))
      }

      if (active) setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [sessionId, getToken, router])

  const toggleStep = (id: string) => {
    const s = steps.find((step) => step.id === id)
    if (!s) return
    // A given-up task can't be reopened from the checklist — it's resolved.
    if (perTaskFinalAction[id] === "GAVE_UP") return

    const wasDone = completedIds.has(id)
    const newCompletedIds = new Set(completedIds)

    if (wasDone) {
      newCompletedIds.delete(id)
      setCompletedIds(newCompletedIds)
      setTaskCheckTimes((prevTimes) => {
        const nextTimes = { ...prevTimes }
        delete nextTimes[id]
        return nextTimes
      })
      setTaskCompletedAt((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setPerTaskFinalAction((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } else {
      newCompletedIds.add(id)
      setCompletedIds(newCompletedIds)
      setTaskCheckTimes((prevTimes) => ({
        ...prevTimes,
        [id]: elapsed,
      }))
      setTaskCompletedAt((prev) => ({
        ...prev,
        [id]: new Date().toISOString(),
      }))
    }
  }

  const handleEnd = async (
    completionType: "EARLY" | "NORMAL" | "OVERTIME",
    finalCompletedIds: Set<string>,
    finalStepDetails: Record<
      string,
      { spentSeconds: number; remainingMinutes: number }
    >,
    redirectTo: string = "/app/focus"
  ) => {
    if (ending) return
    setEnding(true)

    const snapshot: TaskSnapshot[] = steps.map((s) => {
      const done = finalCompletedIds.has(s.id)
      const details = finalStepDetails[s.id]
      const resolvedAction = perTaskFinalAction[s.id] ?? (done ? "DONE" : undefined)
      const extension = perTaskExtensions[s.id]
      const extensionCount = extension?.count ?? 0
      const extensionSecondsTotal = extension?.totalSeconds ?? 0
      const spentSeconds = details?.spentSeconds ?? 0

      return {
        id: s.id,
        done,
        status: done ? "DONE" : "IN_PROGRESS",
        title: s.title,
        durationMinutes: details
          ? details.remainingMinutes
          : s.estimatedMinutes,
        plannedMinutes: s.estimatedMinutes,
        actualSpentSeconds: spentSeconds,
        timingOutcome: resolvedAction
          ? computeTimingOutcome(s.estimatedMinutes, spentSeconds, extensionCount, resolvedAction)
          : undefined,
        completedAt: taskCompletedAt[s.id],
        extensionCount,
        extensionSecondsTotal,
        finalAction: resolvedAction,
        procrastinationScore: resolvedAction
          ? computeProcrastinationScore(s.estimatedMinutes, spentSeconds, extensionCount, resolvedAction)
          : undefined,
      }
    })

    await endFocusSession(
      sessionId,
      {
        completionType,
        actualDuration: elapsed,
        overtimeDuration: isOvertime
          ? Math.max(0, elapsed - adjustedDuration)
          : 0,
        slipCount: 0,
        tasksSnapshot: snapshot,
      },
      getToken
    )

    notifyExtensionSessionEnded({ sessionId, completionType })

    // Clean up local storage
    localStorage.removeItem(`lockin:session:${sessionId}:completedIds`)
    localStorage.removeItem(`lockin:session:${sessionId}:taskCheckTimes`)
    localStorage.removeItem(`lockin:session:${sessionId}:addedSeconds`)
    localStorage.removeItem(`lockin:session:${sessionId}:paused`)
    localStorage.removeItem(`lockin:session:${sessionId}:pausedSecs`)
    localStorage.removeItem(`lockin:session:${sessionId}:pausedAt`)
    localStorage.removeItem(`lockin:session:${sessionId}:steps`)
    if (localStorage.getItem("lockin:active_session_id") === sessionId) {
      localStorage.removeItem("lockin:active_session_id")
    }

    sessionStorage.removeItem(`lockin:session:${sessionId}:steps`)
    router.push(redirectTo)
  }

  // Manual early-end path (EndSprintSummaryModal). Reads live state directly
  // — every incomplete step must already be resolved (DONE or GAVE_UP) via
  // the modal's per-task buttons before this can be invoked (gated by
  // `canEnd` in the modal itself).
  const handleManualEnd = () => {
    const isAllCompleted = steps.every((s) => completedIds.has(s.id))
    const sprintOnTime = steps.every(
      (s) => (perTaskExtensions[s.id]?.count ?? 0) <= 2
    )
    const completionType = computeCompletionType(isAllCompleted, sprintOnTime)
    const details = computeStepDetails(steps, completedIds, taskCheckTimes, elapsed)

    handleEnd(completionType, completedIds, details)
  }

  // All steps done?
  const allDone = steps.length > 0 && steps.every((s) => completedIds.has(s.id))
  const doneCount = completedIds.size
  const planName = plan?.name ?? session?.plan?.name ?? "Sprint"

  if (loading) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading session…</div>
        <Show when="signed-out">
          <RedirectToSignIn />
        </Show>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-35">
        <Aurora
          colorStops={["#F97316", "#EAB308", "#F97316"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.6}
        />
      </div>

      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center px-4 pt-12 pb-16">
        {/* Plan name */}
        <p className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Sprint
        </p>
        <h1 className="mb-8 text-center text-xl font-semibold tracking-tight">
          {planName}
        </h1>

        {/* Timer */}
        <div className="relative mb-8 flex size-52 items-center justify-center">
          {/* SVG ring */}
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-border"
            />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - (allDone ? 100 : pct) / 100)}`}
              strokeLinecap="round"
              className={
                allDone
                  ? "text-emerald-500"
                  : isOvertime
                    ? "text-rose-500"
                    : "text-primary"
              }
              style={{ transition: "stroke-dashoffset 0.5s linear" }}
            />
          </svg>

          {/* Time text */}
          <div className="text-center">
            <div
              className={`font-mono text-4xl font-light tracking-tight tabular-nums ${
                allDone ? "text-emerald-500" : isOvertime ? "text-rose-500" : ""
              }`}
            >
              {allDone ? "" : isOvertime ? "+" : ""}
              {allDone
                ? "00:00"
                : isOvertime
                  ? fmt(elapsed - adjustedDuration)
                  : fmt(remaining)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {allDone
                ? "100% complete"
                : isOvertime
                  ? "overtime"
                  : paused
                    ? "paused"
                    : `${pct}% complete`}
            </div>
          </div>
        </div>

        {/* CSS Keyframes block */}
        <style>{`
          @keyframes run-light {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
          .animate-run-light {
            animation: run-light 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }
          @keyframes fly {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(var(--tx), var(--ty)) scale(0.2);
              opacity: 0;
            }
          }
          .animate-particle {
            animation: fly 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          }
        `}</style>

        {/* Task Progress Bar */}
        {steps.length > 0 && (
          <div
            className={`relative mb-6 w-full overflow-hidden rounded-xl border px-4 py-3.5 shadow-sm transition-[border-color,background-color,box-shadow] duration-500 ${
              triggerAnimate
                ? "border-amber-400/85 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                : "border-border/50 bg-background/40 backdrop-blur-md"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-amber-500 uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                Task Progress
              </span>
              <span className="text-xs font-semibold text-amber-500 tabular-nums">
                {doneCount} / {steps.length} (
                {Math.round((doneCount / steps.length) * 100)}%)
              </span>
            </div>

            <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-border/40 bg-muted/30">
              {/* Progress fill */}
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-[width] duration-500 ease-out"
                style={{ width: `${(doneCount / steps.length) * 100}%` }}
              />
              {/* Glowing completion beam */}
              {triggerAnimate && (
                <div className="animate-run-light pointer-events-none absolute inset-0 w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              )}
            </div>
          </div>
        )}

        {/* Current step */}
        {currentStep && (
          <div className="mb-6 w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-center shadow-sm backdrop-blur-md">
            <p className="mb-0.5 text-xs text-muted-foreground">
              Now working on
            </p>
            <p className="text-sm font-medium">{currentStep.title}</p>
            {currentStep.estimatedMinutes > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                ~{formatMinutes(currentStep.estimatedMinutes)}
              </p>
            )}
            {(() => {
              const allowedSec =
                currentStep.estimatedMinutes * 60 +
                (perTaskExtensions[currentStep.id]?.totalSeconds ?? 0)
              const spent = stepDetails[currentStep.id]?.spentSeconds ?? 0
              const taskOvertimeSeconds = Math.max(0, spent - allowedSec)
              return taskOvertimeSeconds > 0 ? (
                <p className="mt-0.5 font-mono text-xs font-semibold text-rose-500">
                  +{fmt(taskOvertimeSeconds)} over
                </p>
              ) : null
            })()}
          </div>
        )}

        {/* Pause / Resume */}
        <div className="mb-8 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPaused((p) => {
                const next = !p
                // Pause/resume is local-only UI state (never persisted to the
                // server), so pushing to the extension is the only way it can
                // find out — without this its timer keeps running regardless
                // of what the app shows.
                if (next) notifyExtensionSessionPaused(sessionId)
                else notifyExtensionSessionResumed(sessionId)
                return next
              })
            }
            disabled={ending}
          >
            {paused ? (
              <>
                <PlayIcon className="size-3.5" />
                Resume
              </>
            ) : (
              <>
                <PauseIcon className="size-3.5" />
                Pause
              </>
            )}
          </Button>

          {allDone ? (
            <Button
              size="sm"
              onClick={() => setShowEndSprintSummary(true)}
              disabled={ending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <CheckCircle2Icon className="size-3.5" />
              {ending ? "Saving…" : "All done — End Sprint"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEndSprintSummary(true)}
              disabled={ending}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
            >
              <SquareIcon className="size-3.5" />
              {ending ? "Saving…" : "End Sprint"}
            </Button>
          )}
        </div>

        {/* Step checklist */}
        {steps.length > 0 && (
          <section className="w-full">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Steps
              </h2>
              <span className="text-xs text-muted-foreground">
                {doneCount} / {steps.length}
              </span>
            </div>

            <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background/50 shadow-sm backdrop-blur-md">
              {steps.map((step) => {
                const done = completedIds.has(step.id)
                const isCurrent = step.id === currentStep?.id
                return (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/20 ${
                      isCurrent && !done ? "bg-primary/5" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 ${done ? "text-emerald-500" : isCurrent ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {done ? (
                        <CheckCircle2Icon className="size-4" />
                      ) : (
                        <CircleIcon className="size-4" />
                      )}
                    </span>
                    <span
                      className={`flex-1 text-sm ${done ? "text-muted-foreground line-through" : ""}`}
                    >
                      {step.title}
                    </span>
                    {step.estimatedMinutes > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {step.estimatedMinutes}m
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* End Sprint Summary modal */}
      {showEndSprintSummary && (
        <EndSprintSummaryModal
          steps={steps}
          completedIds={completedIds}
          perTaskFinalAction={perTaskFinalAction}
          perTaskExtensions={perTaskExtensions}
          stepDetails={stepDetails}
          elapsed={elapsed}
          isOvertime={isOvertime}
          remaining={remaining}
          onClose={() => setShowEndSprintSummary(false)}
          onMarkDone={handleMarkTaskDone}
          onGiveUp={handleGiveUp}
          onConfirmEnd={handleManualEnd}
          ending={ending}
        />
      )}

      {/* Mid-sprint: the current task alone has run past its own estimate */}
      {!showSprintEndChecklist && activeOvertimeTaskId && currentStep && (
        <TaskOvertimeModal
          mode="task"
          tasks={[
            {
              step: currentStep,
              extensionCount: perTaskExtensions[currentStep.id]?.count ?? 0,
              overtimeSeconds: Math.max(
                0,
                (stepDetails[currentStep.id]?.spentSeconds ?? 0) -
                  (currentStep.estimatedMinutes * 60 +
                    (perTaskExtensions[currentStep.id]?.totalSeconds ?? 0))
              ),
            },
          ]}
          onGiveUp={handleGiveUp}
          onGiveMoreTime={handleGiveMoreTime}
          onMarkDone={handleMarkTaskDone}
        />
      )}

      {/* Sprint's total time is up — resolve every step still pending */}
      {showSprintEndChecklist && unresolvedSteps.length > 0 && (
        <TaskOvertimeModal
          mode="sprint-end"
          tasks={unresolvedSteps.map((step) => ({
            step,
            extensionCount: perTaskExtensions[step.id]?.count ?? 0,
            overtimeSeconds: Math.max(
              0,
              (stepDetails[step.id]?.spentSeconds ?? 0) -
                (step.estimatedMinutes * 60 +
                  (perTaskExtensions[step.id]?.totalSeconds ?? 0))
            ),
          }))}
          onGiveUp={handleGiveUp}
          onGiveMoreTime={handleGiveMoreTime}
          onMarkDone={handleMarkTaskDone}
        />
      )}

      {/* Fireworks Explosion overlay */}
      {particles.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {particles.map((p) => {
            const tx = `${Math.cos(p.angle) * p.speed * 28}px`
            const ty = `${Math.sin(p.angle) * p.speed * 28}px`
            return (
              <span
                key={p.id}
                className="animate-particle absolute top-1/2 left-1/2 h-2 w-2 animate-pulse rounded-full"
                style={
                  {
                    backgroundColor: p.color,
                    boxShadow: `0 0 10px ${p.color}`,
                    marginLeft: "-4px",
                    marginTop: "-4px",
                    "--tx": tx,
                    "--ty": ty,
                  } as React.CSSProperties
                }
              />
            )
          })}
        </div>
      )}
    </main>
  )
}
