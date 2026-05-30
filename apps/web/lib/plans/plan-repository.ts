"use client"

export type SavedPlanTask = {
  id: string
  title: string
  description: string
  dueDate: string
  durationMinutes: number
  isCompleted: boolean
}

export type SavedPlan = {
  id: string
  title: string
  description: string
  completion: string
  tasks: SavedPlanTask[]
  createdAt: string
  updatedAt: string
  version: 1
  serverId?: string  // set after first successful server sync
}

export type PlanSummary = {
  id: string
  title: string
  taskCount: number
  updatedAt: string
}

const PLAN_INDEX_KEY = "lockin.plans.index"
const PLAN_KEY_PREFIX = "lockin.plans.byId."
const PLAN_CHANGE_EVENT = "lockin:plans-changed"

function getPlanKey(id: string) {
  return `${PLAN_KEY_PREFIX}${id}`
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback
  }

  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch (error) {
    console.warn(`Unable to read ${key} from localStorage`, error)
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function emitPlanChanges() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(PLAN_CHANGE_EVENT))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isSavedPlanTask(value: unknown): value is SavedPlanTask {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.dueDate === "string" &&
    typeof value.durationMinutes === "number" &&
    Number.isFinite(value.durationMinutes) &&
    typeof value.isCompleted === "boolean"
  )
}

function isSavedPlan(value: unknown): value is SavedPlan {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.version === 1 &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.completion === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isSavedPlanTask)
  )
}

function isMeaningfulPlan(plan: SavedPlan) {
  return (
    plan.title.trim().length > 0 ||
    plan.description.trim().length > 0 ||
    plan.completion.trim().length > 0 ||
    plan.tasks.length > 0
  )
}

function toSummary(plan: SavedPlan): PlanSummary {
  return {
    id: plan.id,
    title: plan.title,
    taskCount: plan.tasks.length,
    updatedAt: plan.updatedAt,
  }
}

function readIndex() {
  const index = readJson<unknown>(PLAN_INDEX_KEY, [])
  return Array.isArray(index)
    ? index.filter((id): id is string => typeof id === "string")
    : []
}

function writeIndex(ids: string[]) {
  writeJson(PLAN_INDEX_KEY, Array.from(new Set(ids)))
}

export async function getPlan(id: string): Promise<SavedPlan | null> {
  const plan = readJson<unknown>(getPlanKey(id), null)

  if (!isSavedPlan(plan)) {
    return null
  }

  return plan
}

export async function savePlan(plan: SavedPlan): Promise<void> {
  if (!canUseStorage()) {
    return
  }

  try {
    writeJson(getPlanKey(plan.id), plan)

    const existingIds = readIndex()
    const nextIds = isMeaningfulPlan(plan)
      ? [plan.id, ...existingIds.filter((id) => id !== plan.id)]
      : existingIds.filter((id) => id !== plan.id)

    writeIndex(nextIds)
    emitPlanChanges()
  } catch (error) {
    console.warn("Unable to save plan to localStorage", error)
    throw error
  }
}

export async function listPlans(): Promise<PlanSummary[]> {
  const summaries: PlanSummary[] = []

  for (const id of readIndex()) {
    const plan = await getPlan(id)
    if (plan && isMeaningfulPlan(plan)) {
      summaries.push(toSummary(plan))
    }
  }

  return summaries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export async function deletePlan(id: string): Promise<void> {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(getPlanKey(id))
    writeIndex(readIndex().filter((existingId) => existingId !== id))
    emitPlanChanges()
  } catch (error) {
    console.warn("Unable to delete plan from localStorage", error)
  }
}

export function subscribeToPlanChanges(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === PLAN_INDEX_KEY ||
      (event.key?.startsWith(PLAN_KEY_PREFIX) ?? false)
    ) {
      listener()
    }
  }

  window.addEventListener(PLAN_CHANGE_EVENT, listener)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(PLAN_CHANGE_EVENT, listener)
    window.removeEventListener("storage", handleStorage)
  }
}
