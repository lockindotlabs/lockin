"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import {
  CheckCircle2Icon,
  CircleIcon,
  PauseIcon,
  PlayIcon,
  SquareIcon,
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
} from "@/lib/focus/focus-api"
import {
  notifyExtensionSessionEnded,
  notifyExtensionSessionPaused,
  notifyExtensionSessionResumed,
  notifyExtensionTasksUpdated,
} from "@/lib/focus/extension-bridge"
import Aurora from "@/components/Aurora"

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

// ─── End Sprint Checklist Modal ──────────────────────────────────────────────

function EndSprintSummaryModal({
  steps,
  taskCheckTimes,
  elapsed,
  isOvertime,
  remaining,
  initialCompletedIds,
  onClose,
  onConfirm,
  ending,
}: {
  steps: PlanStep[]
  taskCheckTimes: Record<string, number>
  elapsed: number
  isOvertime: boolean
  remaining: number
  initialCompletedIds: Set<string>
  onClose: () => void
  onConfirm: (
    completedIds: Set<string>,
    stepDetails: Record<
      string,
      { spentSeconds: number; remainingMinutes: number }
    >
  ) => void
  ending: boolean
}) {
  const [tempCompleted, setTempCompleted] = React.useState<Set<string>>(
    () => new Set(initialCompletedIds)
  )

  const toggleTempStep = (id: string) => {
    setTempCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Calculate spent times and remaining estimates dynamically based on tempCompleted
  const details = React.useMemo(() => {
    const res: Record<
      string,
      { spentSeconds: number; remainingMinutes: number }
    > = {}
    let previousCompletionTime = 0

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i]
      if (!s) continue
      const done = tempCompleted.has(s.id)
      const originalEstimateSeconds = (s.estimatedMinutes ?? 0) * 60

      let spentSeconds = 0
      if (done) {
        const recordedTime = taskCheckTimes[s.id]
        if (recordedTime !== undefined) {
          spentSeconds = Math.max(0, recordedTime - previousCompletionTime)
          previousCompletionTime = Math.max(
            previousCompletionTime,
            recordedTime
          )
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
  }, [tempCompleted, steps, taskCheckTimes, elapsed])

  const hasIncomplete = steps.some((s) => !tempCompleted.has(s.id))

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
          Confirm completed steps. Incomplete steps will have their estimated
          duration updated based on remaining time.
        </p>

        {/* Warning if there are incomplete steps */}
        {hasIncomplete && (
          <div className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
            <p className="flex items-center gap-1.5 font-semibold">
              <span>⚠️</span> Bạn chưa hoàn thành tất cả nhiệm vụ!
            </p>
            <p className="leading-relaxed">
              Bạn chưa hoàn thành task này, xin hãy quay lại và tập trung nhắc
              nhở sắp xong.
            </p>
          </div>
        )}

        {/* Step checklist */}
        <div className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
          {steps.map((step) => {
            const done = tempCompleted.has(step.id)
            const detail = details[step.id]
            const remainingMin = detail
              ? detail.remainingMinutes
              : step.estimatedMinutes
            const spentSec = detail ? detail.spentSeconds : 0

            return (
              <button
                key={step.id}
                onClick={() => toggleTempStep(step.id)}
                className={`flex w-full items-start gap-3 rounded-lg border border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-muted/30 ${
                  done ? "bg-muted/10" : "bg-background"
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 ${
                    done ? "text-emerald-500" : "text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2Icon className="size-4" />
                  ) : (
                    <CircleIcon className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      done
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {done ? (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Completed
                      </span>
                    ) : (
                      <>
                        Estimate:{" "}
                        <strong className="text-foreground">
                          {remainingMin}m
                        </strong>
                        {spentSec > 0 &&
                          ` (spent ${Math.round(spentSec / 60)}m)`}
                      </>
                    )}
                  </p>
                </div>
              </button>
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
            className={`flex-1 transition-all ${
              hasIncomplete
                ? "border-amber-400 font-semibold text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                : ""
            }`}
            onClick={onClose}
            disabled={ending}
          >
            {hasIncomplete ? "Quay lại & Tập trung" : "Cancel"}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => onConfirm(tempCompleted, details)}
            disabled={ending}
          >
            {ending ? "Ending..." : "Save & End"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useTimer(
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
    setElapsed(Math.max(0, Math.floor((Date.now() - ms) / 1000) - pausedSecsRef.current))
  }, [startedAt])

  React.useEffect(() => {
    if (paused) {
      if (pausedAtRef.current === null) pausedAtRef.current = Date.now()
      return
    }
    if (pausedAtRef.current !== null) {
      pausedSecsRef.current += Math.floor(
        (Date.now() - pausedAtRef.current) / 1000
      )
      pausedAtRef.current = null
    }

    const id = setInterval(() => {
      const raw =
        Math.floor((Date.now() - startRef.current) / 1000) -
        pausedSecsRef.current
      setElapsed(Math.max(0, raw))
    }, 500)

    return () => clearInterval(id)
  }, [paused])

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

  const [session, setSession] = React.useState<FocusSession | null>(null)
  const [plan, setPlan] = React.useState<FocusPlan | null>(null)
  const [steps, setSteps] = React.useState<PlanStep[]>([])
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(new Set())
  const [taskCheckTimes, setTaskCheckTimes] = React.useState<
    Record<string, number>
  >({})
  const [taskSavedSeconds, setTaskSavedSeconds] = React.useState<
    Record<string, number>
  >({})
  const [loading, setLoading] = React.useState(true)
  const [paused, setPaused] = React.useState(false)
  const [overtime, setOvertime] = React.useState(false)
  const [ending, setEnding] = React.useState(false)
  const [showEndSprintSummary, setShowEndSprintSummary] = React.useState(false)
  const [showOvertimePicker, setShowOvertimePicker] = React.useState(false)
  const [overtimeCount, setOvertimeCount] = React.useState(0)
  const [addedSeconds, setAddedSeconds] = React.useState(0)
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
    adjustedDuration,
    paused,
    overtime,
    session?.startedAt ?? null
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

  // Trigger overtime when timer hits 0
  React.useEffect(() => {
    if (remaining <= 0 && !overtime && session) {
      setOvertime(true)
    }
  }, [remaining, overtime, session])

  // Detect time up with incomplete tasks and open overtime picker
  React.useEffect(() => {
    const hasIncomplete = steps.some((s) => !completedIds.has(s.id))
    if (
      remaining <= 0 &&
      hasIncomplete &&
      loading === false &&
      !showOvertimePicker
    ) {
      setShowOvertimePicker(true)
    }
  }, [remaining, steps, completedIds, loading, showOvertimePicker])

  const handleAddTime = (minutes: number) => {
    setAddedSeconds((prev) => prev + minutes * 60)
    setOvertimeCount((prev) => prev + 1)
    setOvertime(false)
    setShowOvertimePicker(false)
  }

  // Load session + plan data
  React.useEffect(() => {
    if (!sessionId) return
    let active = true

    const load = async () => {
      const s = await fetchFocusSession(sessionId, getToken)
      if (!active || !s) return
      setSession(s)

      // Try sessionStorage first (set by hub when creating session)
      const stored = sessionStorage.getItem(`lockin:session:${sessionId}:steps`)
      if (stored) {
        try {
          const parsed: PlanStep[] = JSON.parse(stored)
          setSteps(parsed)
          setLoading(false)
          return
        } catch {}
      }

      // Fallback: fetch plan steps
      if (s.planId) {
        const p = await fetchPlanWithSteps(s.planId, getToken)
        if (!active) return
        setPlan(p)
        setSteps(incompleteSteps(p?.steps ?? []))
      }

      if (active) setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [sessionId, getToken])

  const toggleStep = (id: string) => {
    const s = steps.find((step) => step.id === id)
    if (!s) return

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
    } else {
      newCompletedIds.add(id)
      setCompletedIds(newCompletedIds)
      setTaskCheckTimes((prevTimes) => ({
        ...prevTimes,
        [id]: elapsed,
      }))
    }

    // Push updated task list + adjusted remaining to extension immediately
    // remaining is computed from adjustedDuration so extension timer stays in sync
    notifyExtensionTasksUpdated(
      steps.map((step) => ({
        id: step.id,
        label: step.title,
        done: newCompletedIds.has(step.id),
        durationMinutes: step.estimatedMinutes,
      })),
      remaining
    )
  }

  const handleEnd = async (
    completionType: "EARLY" | "NORMAL" | "OVERTIME",
    finalCompletedIds: Set<string>,
    finalStepDetails: Record<
      string,
      { spentSeconds: number; remainingMinutes: number }
    >
  ) => {
    if (ending) return
    setEnding(true)

    const snapshot: TaskSnapshot[] = steps.map((s) => {
      const done = finalCompletedIds.has(s.id)
      const details = finalStepDetails[s.id]
      return {
        id: s.id,
        done,
        status: done ? "DONE" : "IN_PROGRESS",
        title: s.title,
        durationMinutes: details
          ? details.remainingMinutes
          : s.estimatedMinutes,
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

    sessionStorage.removeItem(`lockin:session:${sessionId}:steps`)
    router.push("/app/focus")
  }

  const handleEndConfirm = (
    finalCompletedIds: Set<string>,
    finalStepDetails: Record<
      string,
      { spentSeconds: number; remainingMinutes: number }
    >
  ) => {
    const isAllCompleted = steps.every((s) => finalCompletedIds.has(s.id))
    const completionType = isOvertime
      ? "OVERTIME"
      : isAllCompleted
        ? "NORMAL"
        : "EARLY"

    handleEnd(completionType, finalCompletedIds, finalStepDetails)
  }

  // All steps done?
  const allDone = steps.length > 0 && steps.every((s) => completedIds.has(s.id))
  const doneCount = completedIds.size
  const planName = plan?.name ?? session?.plan?.name ?? "Sprint"
  const currentStepIndex = steps.findIndex((s) => !completedIds.has(s.id))
  const currentStep = steps[currentStepIndex]

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
            className={`relative mb-6 w-full overflow-hidden rounded-xl border px-4 py-3.5 shadow-sm transition-all duration-500 ${
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
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-500 ease-out"
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
          taskCheckTimes={taskCheckTimes}
          elapsed={elapsed}
          isOvertime={isOvertime}
          remaining={remaining}
          initialCompletedIds={completedIds}
          onClose={() => setShowEndSprintSummary(false)}
          onConfirm={handleEndConfirm}
          ending={ending}
        />
      )}

      {/* Overtime picker modal */}
      {showOvertimePicker && currentStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowOvertimePicker(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border/70 bg-background/95 p-6 text-foreground shadow-2xl backdrop-blur-lg">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              End Focus Time!
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Some tasks are not completed:{" "}
              <strong className="text-foreground">{currentStep.title}</strong>
            </p>

            {/* Overtime count warning */}
            {overtimeCount >= 1 && (
              <div className="mt-4 space-y-1 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/20 dark:text-rose-400">
                <p className="flex items-center gap-1.5 font-semibold">
                  <span>⚠️</span> Warning: Overtime for the {overtimeCount + 1}{" "}
                  time!
                </p>
                <p className="leading-relaxed">
                  You have exceeded the time limit for this task for the{" "}
                  {overtimeCount + 1} time. Consider breaking down the task or
                  taking a short break.
                </p>
              </div>
            )}

            <p className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Add Focus Time:
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[5, 10, 20, 30].map((mins) => (
                <Button
                  key={mins}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTime(mins)}
                  className="font-semibold"
                >
                  +{mins}m
                </Button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground hover:bg-muted"
                onClick={() => {
                  setShowOvertimePicker(false)
                  setShowEndSprintSummary(true)
                }}
              >
                End Sprint
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-amber-500 font-semibold text-white shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:bg-amber-600"
                onClick={() => handleAddTime(5)}
              >
                Continue (+5m)
              </Button>
            </div>
          </div>
        </div>
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
