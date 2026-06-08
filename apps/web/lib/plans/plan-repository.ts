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
  source?: "MANUAL" | "AI"
  aiMode?: "MANUAL" | "ASSISTED"
  breakdownIntensity?: "LOW_ENERGY" | "NORMAL" | "HIGH_ENERGY"
  serverId?: string // set after first successful server sync
}

export type PlanSummary = {
  id: string
  title: string
  taskCount: number
  updatedAt: string
  steps?: {
    id: string
    isCompleted: boolean
    dueDate: string | null
  }[]
}

const PLAN_CHANGE_EVENT = "lockin:plans-changed"

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

function emitPlanChanges() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(PLAN_CHANGE_EVENT))
}

export async function getPlan(id: string): Promise<SavedPlan | null> {
  const response = await fetch(`/api/plans/${encodeURIComponent(id)}`)

  if (response.status === 404) {
    return null
  }

  return parseResponse<SavedPlan>(response)
}

export async function savePlan(plan: SavedPlan): Promise<void> {
  await parseResponse<SavedPlan>(
    await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    })
  )
  emitPlanChanges()
}

export async function listPlans(): Promise<PlanSummary[]> {
  const data = await parseResponse<{ plans: PlanSummary[] }>(
    await fetch("/api/plans")
  )

  return data.plans
}

export async function deletePlan(id: string): Promise<void> {
  const response = await fetch(`/api/plans/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  emitPlanChanges()
}

export function subscribeToPlanChanges(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  window.addEventListener(PLAN_CHANGE_EVENT, listener)

  return () => {
    window.removeEventListener(PLAN_CHANGE_EVENT, listener)
  }
}
