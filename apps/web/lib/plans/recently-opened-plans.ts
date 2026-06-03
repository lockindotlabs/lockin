"use client"

import * as React from "react"

import type { PlanSummary } from "./plan-repository"

const RECENTLY_OPENED_PLANS_KEY = "lockin:plans:recently-opened:v1"
const RECENTLY_OPENED_PLANS_EVENT = "lockin:plans-recently-opened-changed"

type RecentPlanEntry = {
  planId: string
  openedAt: string
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

function readRecentPlanEntries() {
  if (!canUseStorage()) {
    return []
  }

  try {
    const value = window.localStorage.getItem(RECENTLY_OPENED_PLANS_KEY)
    const parsed = value ? JSON.parse(value) : []

    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is RecentPlanEntry =>
            typeof item === "object" &&
            item !== null &&
            "planId" in item &&
            typeof item.planId === "string" &&
            "openedAt" in item &&
            typeof item.openedAt === "string"
        )
      : []
  } catch {
    return []
  }
}

function writeRecentPlanEntries(entries: RecentPlanEntry[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(
    RECENTLY_OPENED_PLANS_KEY,
    JSON.stringify(entries)
  )
}

function emitRecentPlanChanges() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(RECENTLY_OPENED_PLANS_EVENT))
}

export function markPlanOpened(planId: string) {
  const openedAt = new Date().toISOString()
  const entries = readRecentPlanEntries().filter(
    (entry) => entry.planId !== planId
  )

  writeRecentPlanEntries([{ planId, openedAt }, ...entries])
  emitRecentPlanChanges()
}

export function useRecentlyOpenedPlans(plans: PlanSummary[]) {
  const [recentEntries, setRecentEntries] = React.useState<RecentPlanEntry[]>(
    []
  )

  React.useEffect(() => {
    const loadRecentEntries = () => {
      setRecentEntries(readRecentPlanEntries())
    }

    loadRecentEntries()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === RECENTLY_OPENED_PLANS_KEY) {
        loadRecentEntries()
      }
    }

    window.addEventListener(RECENTLY_OPENED_PLANS_EVENT, loadRecentEntries)
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener(
        RECENTLY_OPENED_PLANS_EVENT,
        loadRecentEntries
      )
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  return React.useMemo(() => {
    const openedAtByPlanId = new Map(
      recentEntries.map((entry) => [entry.planId, entry.openedAt])
    )

    return plans
      .map((plan) => ({
        ...plan,
        lastOpenedAt: openedAtByPlanId.get(plan.id) ?? null,
      }))
      .sort((a, b) => {
        const aTime = a.lastOpenedAt ?? a.updatedAt
        const bTime = b.lastOpenedAt ?? b.updatedAt

        return bTime.localeCompare(aTime)
      })
  }, [plans, recentEntries])
}
