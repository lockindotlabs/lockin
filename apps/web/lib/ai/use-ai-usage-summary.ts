"use client"

import * as React from "react"
import { subscribeToPlanChanges } from "@/lib/plans/plan-repository"
import type { BillingTier } from "@/lib/billing/catalog"

export type AiUsageSummary = {
  tier: BillingTier
  credits: {
    used: number
    limit: number
    remaining: number
    percentUsed: number
    resetAt: string
  }
  aiPlans: {
    created: number
    limit: number | null
    remaining: number | null
    percentUsed: number | null
  }
}

export function useAiUsageSummary() {
  const [summary, setSummary] = React.useState<AiUsageSummary | null>(null)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const isMountedRef = React.useRef(false)

  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const reloadAiUsageSummary = React.useCallback(async () => {
    try {
      const response = await fetch("/api/ai/usage-summary", { cache: "no-store" })
      if (!response.ok) {
        return null
      }
      const data = (await response.json()) as AiUsageSummary
      if (isMountedRef.current) {
        setSummary(data)
      }
      return data
    } catch {
      return null
    } finally {
      if (isMountedRef.current) {
        setIsLoaded(true)
      }
    }
  }, [])

  React.useEffect(() => {
    void reloadAiUsageSummary()
  }, [reloadAiUsageSummary])

  React.useEffect(() => {
    // Refresh on plan changes
    const unsubscribe = subscribeToPlanChanges(() => {
      void reloadAiUsageSummary()
    })

    // Refresh on AI usage summary changed event
    const handleAiUsageChanged = () => {
      void reloadAiUsageSummary()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("lockin:ai-usage-summary-changed", handleAiUsageChanged)
    }

    return () => {
      unsubscribe()
      if (typeof window !== "undefined") {
        window.removeEventListener("lockin:ai-usage-summary-changed", handleAiUsageChanged)
      }
    }
  }, [reloadAiUsageSummary])

  return { summary, isLoaded, reloadAiUsageSummary }
}
