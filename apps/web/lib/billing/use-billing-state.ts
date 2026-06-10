"use client"

import * as React from "react"

import type { BillingTier } from "@/lib/billing/catalog"

export type BillingState = {
  tier: BillingTier
  storedTier: BillingTier
  planExpiresAt: string | null
  latestOrder: {
    status: string
    tier: BillingTier
    checkoutUrl: string | null
    payosOrderCode: number
  } | null
}

export function useBillingState() {
  const [billing, setBilling] = React.useState<BillingState | null>(null)
  const [isBillingLoaded, setIsBillingLoaded] = React.useState(false)
  const isMountedRef = React.useRef(false)

  React.useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const reloadBilling = React.useCallback(async () => {
    try {
      const response = await fetch("/api/billing/me", { cache: "no-store" })

      if (!response.ok) {
        return null
      }

      const data = (await response.json()) as BillingState

      if (isMountedRef.current) {
        setBilling(data)
      }

      return data
    } catch {
      return null
    } finally {
      if (isMountedRef.current) {
        setIsBillingLoaded(true)
      }
    }
  }, [])

  React.useEffect(() => {
    void reloadBilling()
  }, [reloadBilling])

  return { billing, isBillingLoaded, reloadBilling }
}
