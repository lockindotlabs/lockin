"use client"

import type { SavedPlan, SavedPlanTask } from "./plan-repository"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

type GetToken = () => Promise<string | null>

async function authHeaders(getToken: GetToken): Promise<HeadersInit> {
  const token = await getToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function toISODate(dateStr: string): string | undefined {
  if (!dateStr) return undefined
  try {
    return new Date(dateStr).toISOString()
  } catch {
    return undefined
  }
}

function taskToBody(task: SavedPlanTask, planId: string, index: number) {
  return {
    title: task.title,
    description: task.description || undefined,
    planId,
    status: task.isCompleted ? "DONE" : "TODO",
    dueDate: toISODate(task.dueDate),
    durationMinutes: task.durationMinutes,
    order: index,
  }
}

export async function createPlanOnServer(
  plan: SavedPlan,
  getToken: GetToken
): Promise<string | null> {
  try {
    const headers = await authHeaders(getToken)

    const planRes = await fetch(`${API_URL}/api/plans`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: plan.title,
        description: plan.description || undefined,
        completion: plan.completion || undefined,
      }),
    })
    if (!planRes.ok) return null

    const { data: serverPlan } = await planRes.json()

    if (plan.tasks.length > 0) {
      await Promise.all(
        plan.tasks.map((task, i) =>
          fetch(`${API_URL}/api/tasks`, {
            method: "POST",
            headers,
            body: JSON.stringify(taskToBody(task, serverPlan.id, i)),
          })
        )
      )
    }

    return serverPlan.id as string
  } catch {
    return null
  }
}

export async function updatePlanOnServer(
  plan: SavedPlan,
  serverId: string,
  getToken: GetToken
): Promise<boolean> {
  try {
    const headers = await authHeaders(getToken)

    const planRes = await fetch(`${API_URL}/api/plans/${serverId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        name: plan.title,
        description: plan.description || undefined,
        completion: plan.completion || undefined,
      }),
    })
    if (!planRes.ok) return false

    // Delete old tasks then recreate — simple replace strategy
    const existingRes = await fetch(
      `${API_URL}/api/tasks?planId=${serverId}`,
      { headers }
    )
    if (existingRes.ok) {
      const { data: existing } = await existingRes.json()
      await Promise.all(
        (existing as Array<{ id: string }>).map((t) =>
          fetch(`${API_URL}/api/tasks/${t.id}`, { method: "DELETE", headers })
        )
      )
    }

    if (plan.tasks.length > 0) {
      await Promise.all(
        plan.tasks.map((task, i) =>
          fetch(`${API_URL}/api/tasks`, {
            method: "POST",
            headers,
            body: JSON.stringify(taskToBody(task, serverId, i)),
          })
        )
      )
    }

    return true
  } catch {
    return false
  }
}

export async function deletePlanOnServer(
  serverId: string,
  getToken: GetToken
): Promise<void> {
  try {
    const headers = await authHeaders(getToken)
    await fetch(`${API_URL}/api/plans/${serverId}`, {
      method: "DELETE",
      headers,
    })
  } catch {
    // fire-and-forget — local delete already happened
  }
}
