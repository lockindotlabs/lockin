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
import { notifyExtensionSessionEnded } from "@/lib/focus/extension-bridge"

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

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useTimer(plannedDuration: number, paused: boolean, overtime: boolean) {
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef<number>(Date.now())
  const pausedSecsRef = React.useRef<number>(0)
  const pausedAtRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (paused) {
      if (pausedAtRef.current === null) pausedAtRef.current = Date.now()
      return
    }
    if (pausedAtRef.current !== null) {
      pausedSecsRef.current += Math.floor((Date.now() - pausedAtRef.current) / 1000)
      pausedAtRef.current = null
    }

    const id = setInterval(() => {
      const raw = Math.floor((Date.now() - startRef.current) / 1000) - pausedSecsRef.current
      setElapsed(Math.max(0, raw))
    }, 500)

    return () => clearInterval(id)
  }, [paused])

  const remaining = Math.max(0, plannedDuration - elapsed)
  const isOvertime = overtime || remaining <= 0
  const pct = Math.min(100, Math.round((elapsed / plannedDuration) * 100))

  return { elapsed, remaining, isOvertime, pct, pausedSecs: pausedSecsRef.current }
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
  const [loading, setLoading] = React.useState(true)
  const [paused, setPaused] = React.useState(false)
  const [overtime, setOvertime] = React.useState(false)
  const [ending, setEnding] = React.useState(false)

  const plannedDuration = session?.plannedDuration ?? 25 * 60
  const { elapsed, remaining, isOvertime, pct } = useTimer(plannedDuration, paused, overtime)

  // Trigger overtime when timer hits 0
  React.useEffect(() => {
    if (remaining <= 0 && !overtime && session) {
      setOvertime(true)
    }
  }, [remaining, overtime, session])

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
    return () => { active = false }
  }, [sessionId, getToken])

  const toggleStep = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleEnd = async (completionType: "EARLY" | "NORMAL" | "OVERTIME") => {
    if (ending) return
    setEnding(true)

    const snapshot: TaskSnapshot[] = steps.map((s) => ({
      id: s.id,
      done: completedIds.has(s.id),
      status: completedIds.has(s.id) ? "DONE" : "IN_PROGRESS",
      title: s.title,
      durationMinutes: s.estimatedMinutes,
    }))

    await endFocusSession(
      sessionId,
      {
        completionType,
        actualDuration: elapsed,
        overtimeDuration: isOvertime ? Math.max(0, elapsed - plannedDuration) : 0,
        slipCount: 0,
        tasksSnapshot: snapshot,
      },
      getToken
    )

    // Push the end event straight to the extension — it has no other way to
    // learn "the user just pressed End in the app" besides its periodic poll
    // (background.js `session-poll`, up to a 1-minute lag). Without this, the
    // extension's local timer keeps running independently after the app has
    // already closed the sprint out.
    notifyExtensionSessionEnded({ sessionId, completionType })

    sessionStorage.removeItem(`lockin:session:${sessionId}:steps`)
    router.push("/app/focus")
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
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>

      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 pb-16 pt-12">

        {/* Plan name */}
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className={isOvertime ? "text-rose-500" : "text-primary"}
              style={{ transition: "stroke-dashoffset 0.5s linear" }}
            />
          </svg>

          {/* Time text */}
          <div className="text-center">
            <div
              className={`font-mono text-4xl font-light tabular-nums tracking-tight ${
                isOvertime ? "text-rose-500" : ""
              }`}
            >
              {isOvertime ? "+" : ""}
              {isOvertime ? fmt(elapsed - plannedDuration) : fmt(remaining)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {isOvertime
                ? "overtime"
                : paused
                  ? "paused"
                  : `${pct}% complete`}
            </div>
          </div>
        </div>

        {/* Current step */}
        {currentStep && (
          <div className="mb-6 w-full rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Now working on</p>
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
            onClick={() => setPaused((p) => !p)}
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
              onClick={() => handleEnd("NORMAL")}
              disabled={ending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2Icon className="size-3.5" />
              {ending ? "Saving…" : "All done — End Sprint"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEnd(isOvertime ? "OVERTIME" : "EARLY")}
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
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Steps
              </h2>
              <span className="text-xs text-muted-foreground">
                {doneCount} / {steps.length}
              </span>
            </div>

            <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background">
              {steps.map((step) => {
                const done = completedIds.has(step.id)
                const isCurrent = step.id === currentStep?.id
                return (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 first:rounded-t-xl last:rounded-b-xl ${
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
    </main>
  )
}
