"use client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

async function authHeaders(getToken: () => Promise<string | null>) {
  const token = await getToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanStep = {
  id: string
  title: string
  description: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED"
  dueDate: string | null
  estimatedMinutes: number
  order: number
  guidance?: string | null
}

export type FocusPlan = {
  id: string
  name: string
  status: "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  totalEstimatedMinutes: number
  updatedAt: string
  steps?: PlanStep[]
}

export type FocusSession = {
  id: string
  planId: string | null
  plan: { id: string; name: string } | null
  startedAt: string
  endedAt: string | null
  duration: number | null
  plannedDuration: number | null
  overtimeDuration: number | null
  completionType: "EARLY" | "NORMAL" | "OVERTIME" | null
  slipCount: number | null
}

export type TimingOutcome =
  | "EARLY"
  | "ON_TIME"
  | "OVERTIME_RESOLVED"
  | "OVERTIME_FAILED"
  | "GAVE_UP"

export type TaskFinalAction = "DONE" | "GAVE_UP"

export type TaskSnapshot = {
  id: string
  done: boolean
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED"
  title?: string
  durationMinutes?: number
  plannedMinutes?: number
  actualSpentSeconds?: number
  timingOutcome?: TimingOutcome
  completedAt?: string
  extensionCount?: number
  extensionSecondsTotal?: number
  finalAction?: TaskFinalAction
  procrastinationScore?: number
}

type StoredPlanSummary = {
  id: string
  title: string
  taskCount: number
  updatedAt: string
}

type StoredPlan = {
  id: string
  title: string
  description: string
  completion: string
  tasks: Array<{
    id: string
    title: string
    description: string
    dueDate: string
    durationMinutes: number
    isCompleted: boolean
    guidance?: string | null
  }>
  createdAt: string
  updatedAt: string
  version: 1
}

function getPlanStatus(tasks: StoredPlan["tasks"]): FocusPlan["status"] {
  if (tasks.length === 0) {
    return "PLANNING"
  }

  if (tasks.every((task) => task.isCompleted)) {
    return "COMPLETED"
  }

  return "ACTIVE"
}

function toFocusPlan(plan: StoredPlan): FocusPlan {
  const steps = plan.tasks.map<PlanStep>((task, index) => ({
    id: task.id,
    title: task.title,
    description: task.description || null,
    status: task.isCompleted ? "DONE" : "TODO",
    dueDate: task.dueDate || null,
    estimatedMinutes: task.durationMinutes,
    order: index,
    guidance: task.guidance ?? null,
  }))

  return {
    id: plan.id,
    name: plan.title,
    status: getPlanStatus(plan.tasks),
    totalEstimatedMinutes: plan.tasks.reduce(
      (sum, task) => sum + task.durationMinutes,
      0
    ),
    updatedAt: plan.updatedAt,
    steps,
  }
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function fetchPlans(
  getToken: () => Promise<string | null>
): Promise<FocusPlan[]> {
  try {
    const res = await fetch("/api/plans", { cache: "no-store" })
    if (!res.ok) return []
    const { plans } = (await res.json()) as { plans?: StoredPlanSummary[] }

    return (plans ?? []).map((plan) => ({
      id: plan.id,
      name: plan.title,
      status: plan.taskCount > 0 ? "ACTIVE" : "PLANNING",
      totalEstimatedMinutes: 0,
      updatedAt: plan.updatedAt,
    }))
  } catch {
    return []
  }
}

export async function fetchPlanWithSteps(
  planId: string,
  getToken: () => Promise<string | null>
): Promise<FocusPlan | null> {
  try {
    const res = await fetch(`/api/plans/${planId}`, { cache: "no-store" })
    if (!res.ok) return null
    const data = (await res.json()) as StoredPlan
    return toFocusPlan(data)
  } catch {
    return null
  }
}

// ─── Focus Sessions ───────────────────────────────────────────────────────────

export async function fetchFocusSessions(
  getToken: () => Promise<string | null>
): Promise<FocusSession[]> {
  try {
    const headers = await authHeaders(getToken)
    const res = await fetch(`${API_BASE}/api/focus-sessions`, { headers })
    if (!res.ok) return []
    const { data } = await res.json()
    return data ?? []
  } catch {
    return []
  }
}

export async function fetchFocusSession(
  sessionId: string,
  getToken: () => Promise<string | null>
): Promise<FocusSession | null> {
  try {
    const headers = await authHeaders(getToken)
    const res = await fetch(`${API_BASE}/api/focus-sessions/${sessionId}`, {
      headers,
    })
    if (!res.ok) return null
    const { data } = await res.json()
    return data ?? null
  } catch {
    return null
  }
}

export async function startFocusSession(
  payload: { planId?: string; plannedDuration?: number },
  getToken: () => Promise<string | null>
): Promise<FocusSession | null> {
  try {
    const headers = await authHeaders(getToken)
    const res = await fetch(`${API_BASE}/api/focus-sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const { data } = await res.json()
    return data ?? null
  } catch {
    return null
  }
}

export async function endFocusSession(
  sessionId: string,
  payload: {
    completionType: "EARLY" | "NORMAL" | "OVERTIME"
    actualDuration: number
    overtimeDuration?: number
    slipCount?: number
    tasksSnapshot?: TaskSnapshot[]
  },
  getToken: () => Promise<string | null>
): Promise<FocusSession | null> {
  try {
    const headers = await authHeaders(getToken)
    const res = await fetch(`${API_BASE}/api/focus-sessions/${sessionId}/end`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const { data } = await res.json()
    return data ?? null
  } catch {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY_START = new Date()
TODAY_START.setHours(0, 0, 0, 0)

const TODAY_END = new Date()
TODAY_END.setHours(23, 59, 59, 999)

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d >= TODAY_START && d <= TODAY_END
}

export function incompleteSteps(steps: PlanStep[]): PlanStep[] {
  return steps.filter((s) => s.status === "TODO" || s.status === "IN_PROGRESS")
}

export function effortTodaySeconds(sessions: FocusSession[]): number {
  return sessions
    .filter((s) => s.endedAt && isToday(s.endedAt) && s.duration != null)
    .reduce((sum, s) => sum + (s.duration ?? 0), 0)
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
