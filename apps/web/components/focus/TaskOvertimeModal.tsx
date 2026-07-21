"use client"

import { Button } from "@workspace/ui/components/button"
import { CircleIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { PlanStep } from "@/lib/focus/focus-api"

const EXTENSION_PRESETS = [5, 10, 15]

type OvertimeTask = {
  step: PlanStep
  extensionCount: number
  overtimeSeconds: number
}

type TaskOvertimeModalProps = {
  mode: "task" | "sprint-end"
  tasks: OvertimeTask[]
  onGiveUp: (stepId: string) => void
  onGiveMoreTime: (stepId: string, minutes: number) => void
  onMarkDone: (stepId: string) => void
}

// Commitment-enforcing overtime flow — fired per-task while a step's own
// estimate runs out mid-sprint, and again (listing every unresolved step) once
// the sprint's total time hits zero. There is no "just leave" escape hatch;
// every overtime task must be resolved via one of the three actions below.
// "I actually done this" is trusted on the spot — the honesty reminder below
// the button is the only check, no second confirmation dialog.
export function TaskOvertimeModal({
  mode,
  tasks,
  onGiveUp,
  onGiveMoreTime,
  onMarkDone,
}: TaskOvertimeModalProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/70 bg-background/95 p-6 text-foreground shadow-2xl backdrop-blur-lg">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {mode === "task"
            ? t("app.focus.overtime.taskTitle")
            : t("app.focus.overtime.sprintTitle")}
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {mode === "task"
            ? t("app.focus.overtime.taskDescription")
            : t("app.focus.overtime.sprintDescription")}
        </p>

        <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {tasks.map(({ step, extensionCount, overtimeSeconds }) => (
            <div
              key={step.id}
              className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/15"
            >
              <div className="flex items-start gap-2">
                <CircleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-rose-500">
                    {t("app.focus.overtime.overEstimate", {
                      duration: fmtOvertime(overtimeSeconds),
                    })}
                  </p>
                  {extensionCount > 0 && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {t("app.focus.overtime.extensionCount", {
                        count: extensionCount,
                      })}
                      {extensionCount > 2 && (
                        <span className="ml-1 font-semibold text-rose-500">
                          {t("app.focus.overtime.notOnTimeWarning")}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {EXTENSION_PRESETS.map((mins) => (
                  <Button
                    key={mins}
                    variant="outline"
                    size="sm"
                    className="font-semibold"
                    onClick={() => onGiveMoreTime(step.id, mins)}
                  >
                    +{mins}m
                  </Button>
                ))}
              </div>

              <div className="mt-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-muted-foreground hover:bg-muted"
                  onClick={() => onGiveUp(step.id)}
                >
                  {t("app.focus.overtime.giveUp")}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => onMarkDone(step.id)}
                >
                  {t("app.focus.overtime.markDone")}
                </Button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground/80">
                {t("app.focus.overtime.honesty")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function fmtOvertime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}
