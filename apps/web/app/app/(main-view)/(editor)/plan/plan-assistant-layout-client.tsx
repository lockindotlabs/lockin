"use client"

import type { PropsWithChildren } from "react"
import { useSearchParams } from "next/navigation"

import { AssistantSidebar } from "@/components/assistant-ui/assistant-sidebar"

export function PlanAssistantLayoutClient({ children }: PropsWithChildren) {
  const searchParams = useSearchParams()
  const planId = searchParams.get("id")

  if (!planId) {
    return children
  }

  return <AssistantSidebar activePlanId={planId}>{children}</AssistantSidebar>
}
