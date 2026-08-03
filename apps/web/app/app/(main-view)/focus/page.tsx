"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { useRouter, useSearchParams } from "next/navigation"
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
  GlobeIcon,
  PlusIcon,
  ShieldIcon,
  XIcon,
} from "lucide-react"
import {
  fetchPlans,
  fetchFocusSessions,
  fetchFocusBlockSettings,
  fetchPlanWithSteps,
  saveFocusBlockSettings,
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
import {
  detectExtensionInstalled,
  hasRememberedExtensionConnection,
  notifyExtensionSessionStarted,
} from "@/lib/focus/extension-bridge"
import DurationMismatchNotice from "./DurationMismatchNotice"
import { TryExtensionPopover } from "@/components/try-extension-popover"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Badge } from "@workspace/ui/components/badge"
import { LayoutGrid01, List } from "@untitledui/icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  DEFAULT_HARD_BLOCK_DOMAINS,
  DEFAULT_SOFT_BLOCK_DOMAINS,
  normalizeDomain,
  uniqueDomains,
  withDefaultBlockSuggestions,
  type FocusBlockSettings,
} from "@/lib/focus/block-settings"

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
  initialBlockSettings,
  onStart,
  onClose,
  loading,
}: {
  plan: FocusPlan
  steps: PlanStep[]
  initialBlockSettings: FocusBlockSettings
  onStart: (
    selectedSteps: PlanStep[],
    durationSeconds: number,
    blockSettings: FocusBlockSettings
  ) => void
  onClose: () => void
  loading: boolean
}) {
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(steps.map((s) => s.id))
  )
  const [durationSeconds, setDurationSeconds] = React.useState<number | null>(
    null
  )
  const [blockSettings, setBlockSettings] = React.useState<FocusBlockSettings>(
    () => withDefaultBlockSuggestions(initialBlockSettings)
  )
  const [newDomain, setNewDomain] = React.useState("")
  const [newDomainMode, setNewDomainMode] = React.useState<"hard" | "soft">(
    "hard"
  )
  const [extensionInstalled, setExtensionInstalled] = React.useState<boolean>(
    () => hasRememberedExtensionConnection()
  )

  React.useEffect(() => {
    let active = true

    detectExtensionInstalled().then((installed) => {
      if (active) setExtensionInstalled(installed)
    })

    return () => {
      active = false
    }
  }, [])

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

  const toggleBlockedDomain = (
    domain: string,
    mode: "hard" | "soft",
    checked?: boolean
  ) => {
    if (!extensionInstalled) return

    const normalized = normalizeDomain(domain)
    if (!normalized) return

    setBlockSettings((prev) => {
      const hard = new Set(prev.blocklistHard.map(normalizeDomain))
      const soft = new Set(prev.blocklistSoft.map(normalizeDomain))
      const target = mode === "hard" ? hard : soft
      const other = mode === "hard" ? soft : hard
      const shouldInclude = checked ?? !target.has(normalized)

      target.delete(normalized)
      other.delete(normalized)
      if (shouldInclude) target.add(normalized)

      return {
        ...prev,
        blocklistHard: Array.from(hard),
        blocklistSoft: Array.from(soft),
      }
    })
  }

  const addBlockedDomain = () => {
    if (!extensionInstalled) return

    const normalized = normalizeDomain(newDomain)
    if (!normalized) return
    toggleBlockedDomain(normalized, newDomainMode, true)
    setNewDomain("")
  }

  const suggestedHard = uniqueDomains([
    ...DEFAULT_HARD_BLOCK_DOMAINS,
    ...blockSettings.blocklistHard,
  ])
  const suggestedSoft = uniqueDomains([
    ...DEFAULT_SOFT_BLOCK_DOMAINS,
    ...blockSettings.blocklistSoft,
  ]).filter((domain) => !blockSettings.blocklistHard.includes(domain))
  const blockedCount =
    blockSettings.blocklistHard.length + blockSettings.blocklistSoft.length

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-background shadow-2xl">
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

        <div className="grid max-h-[68vh] gap-5 overflow-y-auto px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
          <div className="space-y-5">
            {/* Steps */}
            <div>
              <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Tasks in this sprint
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

          <div className="relative rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  <ShieldIcon className="size-3.5" />
                  Websites blocked
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  These settings are saved and reused for future sprints.
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {blockedCount}
              </Badge>
            </div>

            <button
              type="button"
              onClick={() =>
                extensionInstalled &&
                setBlockSettings((prev) => ({
                  ...prev,
                  tabGuard: !prev.tabGuard,
                }))
              }
              disabled={!extensionInstalled}
              className="mb-3 flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                <span className="block font-medium">Tab guard</span>
                <span className="text-xs text-muted-foreground">
                  Remind me when I drift to a blocked page.
                </span>
              </span>
              {blockSettings.tabGuard ? (
                <CheckCircle2Icon className="size-4 text-primary" />
              ) : (
                <CircleIcon className="size-4 text-muted-foreground" />
              )}
            </button>

            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Hard block - redirect
                </p>
                <div className="space-y-1">
                  {suggestedHard.map((domain) => {
                    const checked = blockSettings.blocklistHard.includes(domain)
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleBlockedDomain(domain, "hard")}
                        disabled={!extensionInstalled}
                        className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
                          checked
                            ? "border-amber-300 bg-amber-50 text-foreground dark:border-amber-900/60 dark:bg-amber-950/20"
                            : "border-border bg-background hover:bg-muted/60"
                        }`}
                      >
                        {checked ? (
                          <CheckCircle2Icon className="size-3.5 shrink-0 text-amber-600" />
                        ) : (
                          <CircleIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1 truncate font-mono">
                          {domain}
                        </span>
                        <span className="rounded-full bg-black px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                          HARD
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Soft block - reminder
                </p>
                <div className="space-y-1">
                  {suggestedSoft.map((domain) => {
                    const checked = blockSettings.blocklistSoft.includes(domain)
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleBlockedDomain(domain, "soft")}
                        disabled={!extensionInstalled}
                        className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
                          checked
                            ? "border-primary/40 bg-primary/5 text-foreground"
                            : "border-border bg-background hover:bg-muted/60"
                        }`}
                      >
                        {checked ? (
                          <CheckCircle2Icon className="size-3.5 shrink-0 text-primary" />
                        ) : (
                          <CircleIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1 truncate font-mono">
                          {domain}
                        </span>
                        <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                          SOFT
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-2.5">
                <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  value={newDomain}
                  disabled={!extensionInstalled}
                  onChange={(event) => setNewDomain(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addBlockedDomain()
                  }}
                  placeholder="e.g. twitter.com"
                  className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  extensionInstalled &&
                  setNewDomainMode((mode) =>
                    mode === "hard" ? "soft" : "hard"
                  )
                }
                disabled={!extensionInstalled}
                className="rounded-lg border border-border px-2 text-[10px] font-bold uppercase"
              >
                {newDomainMode}
              </button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="px-2"
                onClick={addBlockedDomain}
                disabled={!extensionInstalled}
              >
                <PlusIcon className="size-3.5" />
              </Button>
            </div>

            {(blockSettings.blocklistHard.length > 0 ||
              blockSettings.blocklistSoft.length > 0) && (
              <button
                type="button"
                onClick={() =>
                  setBlockSettings((prev) => ({
                    ...prev,
                    blocklistHard: [],
                    blocklistSoft: [],
                  }))
                }
                disabled={!extensionInstalled}
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3" />
                Clear blocked sites
              </button>
            )}

            {!extensionInstalled && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 p-4 backdrop-blur-[2px]">
                <div className="max-w-64 rounded-xl border bg-background p-4 text-center shadow-sm">
                  <ShieldIcon className="mx-auto mb-2 size-5 text-primary" />
                  <p className="text-sm font-medium">Try Extension</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Blocked websites need the LockIn Chrome extension to run in
                    your browser.
                  </p>
                  <TryExtensionPopover
                    trigger={
                      <Button type="button" size="sm" className="mt-3">
                        Try Extension
                      </Button>
                    }
                  />
                </div>
              </div>
            )}
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
            onClick={() =>
              onStart(selectedSteps, chosenDuration, {
                blocklistHard: extensionInstalled
                  ? uniqueDomains(blockSettings.blocklistHard)
                  : [],
                blocklistSoft: extensionInstalled
                  ? uniqueDomains(blockSettings.blocklistSoft)
                  : [],
                tabGuard: extensionInstalled ? blockSettings.tabGuard : false,
              })
            }
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
  const { t } = useTranslation()
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
              {t("app.focus.dueTodayCount", {
                count: dueToday.length,
                defaultValue: `${dueToday.length} due today`,
              })}
            </span>
          )}
          {isCompleted && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              {t("app.plans.status.completed", { defaultValue: "Completed" })}
            </span>
          )}
        </div>
        {nextStep ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {t("app.focus.nextStep", { defaultValue: "Next:" })}{" "}
            {nextStep.title}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground/75 italic">
            {t("app.focus.allStepsCompleted", {
              defaultValue: "All steps completed",
            })}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2Icon className="size-3 text-emerald-500" />
            {t("app.focus.stepCount", {
              count: isCompleted
                ? (plan.steps?.length ?? 0)
                : incomplete.length,
              defaultValue: `${isCompleted ? (plan.steps?.length ?? 0) : incomplete.length} step${isCompleted || incomplete.length !== 1 ? "s" : ""}`,
            })}
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
          {t("app.focus.sprint", { defaultValue: "Sprint" })}
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
  const { t } = useTranslation()
  const { state } = useSidebar()
  const { getToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoOpenedPlanIdRef = React.useRef<string | null>(null)

  const [plans, setPlans] = React.useState<FocusPlan[]>([])
  const [sessions, setSessions] = React.useState<FocusSession[]>([])
  const [blockSettings, setBlockSettings] = React.useState<FocusBlockSettings>({
    blocklistHard: [],
    blocklistSoft: [],
    tabGuard: false,
  })
  const [loading, setLoading] = React.useState(true)
  const [setupPlan, setSetupPlan] = React.useState<FocusPlan | null>(null)
  const [setupSteps, setSetupSteps] = React.useState<PlanStep[]>([])
  const [loadingSteps, setLoadingSteps] = React.useState(false)
  const [starting, setStarting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<
    "ALL" | "OVERDUE" | "DUE_TODAY" | "ON_TRACK" | "COMPLETED"
  >("ALL")
  const [viewMode, setViewMode] = React.useState<"CARD" | "LIST">("CARD")

  // Load hub data
  React.useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([
      fetchPlans(getToken),
      fetchFocusSessions(getToken),
      fetchFocusBlockSettings(getToken),
    ]).then(async ([rawPlans, rawSessions, loadedBlockSettings]) => {
      if (!active) return
      setBlockSettings(loadedBlockSettings)

      const activeSession = rawSessions.find((s) => s.endedAt === null)
      if (activeSession) {
        localStorage.setItem("lockin:active_session_id", activeSession.id)
        router.push(`/app/focus/session/${activeSession.id}`)
        return
      }

      const withSteps = await Promise.all(
        rawPlans.map((p) =>
          fetchPlanWithSteps(p.id, getToken).then((full) => full ?? p)
        )
      )

      if (!active) return

      const sorted = withSteps.sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

      setPlans(sorted)
      setSessions(rawSessions)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [getToken])

  // Open sprint setup for a plan
  const handleStartSprint = React.useCallback(async (plan: FocusPlan) => {
    setLoadingSteps(true)
    setSetupPlan(plan)
    const full = await fetchPlanWithSteps(plan.id, getToken)
    const steps = incompleteSteps(full?.steps ?? plan.steps ?? [])
    setSetupSteps(steps)
    setLoadingSteps(false)
  }, [getToken])

  React.useEffect(() => {
    const requestedPlanId = searchParams.get("plan")
    if (
      !requestedPlanId ||
      loading ||
      setupPlan ||
      autoOpenedPlanIdRef.current === requestedPlanId
    ) {
      return
    }

    const plan = plans.find((item) => item.id === requestedPlanId)
    if (!plan) return

    autoOpenedPlanIdRef.current = requestedPlanId
    void handleStartSprint(plan)
  }, [handleStartSprint, loading, plans, searchParams, setupPlan])

  // Create session and navigate
  const handleConfirmSprint = async (
    selectedSteps: PlanStep[],
    durationSeconds: number,
    nextBlockSettings: FocusBlockSettings
  ) => {
    if (!setupPlan) return
    setStarting(true)

    const savedBlockSettings = await saveFocusBlockSettings(
      nextBlockSettings,
      getToken
    )
    setBlockSettings(savedBlockSettings ?? nextBlockSettings)

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

      // Backup steps and session ID in localStorage for tab-recovery
      localStorage.setItem("lockin:active_session_id", session.id)
      localStorage.setItem(
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
        blocklistHard: nextBlockSettings.blocklistHard,
        blocklistSoft: nextBlockSettings.blocklistSoft,
        tabGuard: nextBlockSettings.tabGuard,
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

  const countAll = plans.length
  const countOverdue = plans.filter(
    (p) => getPlanCategory(p) === "OVERDUE"
  ).length
  const countDueToday = plans.filter(
    (p) => getPlanCategory(p) === "DUE_TODAY"
  ).length
  const countOnTrack = plans.filter(
    (p) => getPlanCategory(p) === "ON_TRACK"
  ).length
  const countCompleted = plans.filter(
    (p) => getPlanCategory(p) === "COMPLETED"
  ).length

  const filteredPlans = plans.filter((p) => {
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

  const dueTodayPlans = plans.filter((p) => getPlanCategory(p) === "DUE_TODAY")

  return (
    <>
      <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
        <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
          <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 lg:py-0">
          {/* Effort Today pill */}
          {effortSeconds > 0 && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TimerIcon className="size-3.5" />
              {t("app.focus.focusedToday", {
                duration: formatDuration(effortSeconds),
                defaultValue: `${formatDuration(effortSeconds)} focused today`,
              })}
            </div>
          )}

          {/* Page title */}
          <div className="mb-5 flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-medium tracking-tight">
                {t("app.nav.focus", { defaultValue: "Focus" })}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {dueTodayPlans.length > 0
                  ? t("app.focus.dueTodayPlans", {
                      count: dueTodayPlans.length,
                      defaultValue: `${dueTodayPlans.length} plan${dueTodayPlans.length !== 1 ? "s" : ""} with steps due today.`,
                    })
                  : t("app.focus.pickPlan", {
                      defaultValue: "Pick a plan and start a sprint.",
                    })}
              </p>
            </div>
          </div>

          {/* Tabs and layout control */}
          {!loading && plans.length > 0 && (
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
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="gap-1.5"
                    >
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
          )}

          {/* Main content grid/list */}
          <div className="mb-12">
            {loading ? (
              <div className="space-y-4">
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
                  {t("app.focus.emptyTitle", {
                    defaultValue: "Nothing ready to sprint on",
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("app.focus.emptyDescription", {
                    defaultValue: "Create a plan to get started.",
                  })}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push("/app/plan")}
                >
                  {t("app.focus.createPlan", { defaultValue: "Create a plan" })}
                </Button>
              </div>
            ) : filteredPlans.length > 0 ? (
              viewMode === "CARD" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredPlans.map((plan) => (
                    <PlanQueueCard
                      key={plan.id}
                      plan={plan}
                      onStartSprint={handleStartSprint}
                    />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="*:text-muted-foreground hover:bg-background">
                      <TableHead className="w-[50%]">
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
                      <TableHead className="w-[15%] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.map((plan) => {
                      const incomplete = incompleteSteps(plan.steps ?? [])
                      const nextStep = incomplete[0]
                      const totalMin = incomplete.reduce(
                        (s, t) => s + (t.estimatedMinutes ?? 0),
                        0
                      )
                      const category = getPlanCategory(plan)
                      const isCompleted = category === "COMPLETED"

                      return (
                        <TableRow
                          key={plan.id}
                          className="group/row transition-none!"
                        >
                          <TableCell className="font-medium">
                            <div className="truncate text-sm font-medium">
                              {plan.name}
                            </div>
                            {nextStep ? (
                              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                {t("app.focus.nextStep", {
                                  defaultValue: "Next:",
                                })}{" "}
                                {nextStep.title}
                              </div>
                            ) : (
                              <div className="mt-0.5 truncate text-xs text-muted-foreground/75 italic">
                                {t("app.focus.allStepsCompleted", {
                                  defaultValue: "All steps completed",
                                })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <CategoryBadge category={category} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1">
                                <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                                {isCompleted
                                  ? (plan.steps?.length ?? 0)
                                  : incomplete.length}{" "}
                                {t("app.focus.stepUnit", {
                                  defaultValue:
                                    isCompleted || incomplete.length !== 1
                                      ? "steps"
                                      : "step",
                                })}
                              </span>
                              {!isCompleted && totalMin > 0 && (
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="size-3.5" />~
                                  {formatMinutes(totalMin)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {!isCompleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartSprint(plan)}
                              >
                                <PlayIcon className="size-3.5" />
                                {t("app.focus.sprint", {
                                  defaultValue: "Sprint",
                                })}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )
            ) : (
              <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
                <CheckCircle2Icon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
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
          </div>

          {/* Recent Sprints */}
          {(recentSessions.length > 0 || !loading) && (
            <section className="mt-16">
              <h2 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("app.focus.recentSprints", {
                  defaultValue: "Recent Sprints",
                })}
              </h2>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("app.focus.noSprints", {
                    defaultValue: "No sprints yet.",
                  })}
                </p>
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
            initialBlockSettings={blockSettings}
            onStart={handleConfirmSprint}
            onClose={() => setSetupPlan(null)}
            loading={starting}
          />
        )}
      </ScrollArea>
    </>
  )
}
