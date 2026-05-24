"use client"

import * as React from "react"
import {
  listPlans,
  subscribeToPlanChanges,
  type PlanSummary,
} from "./plan-repository"

export function usePlanSummaries() {
  const [plans, setPlans] = React.useState<PlanSummary[]>([])
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    let isActive = true

    const loadPlans = () => {
      void listPlans().then((nextPlans) => {
        if (!isActive) {
          return
        }

        setPlans(nextPlans)
        setIsLoaded(true)
      })
    }

    loadPlans()
    const unsubscribe = subscribeToPlanChanges(loadPlans)

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  return { plans, isLoaded }
}
