"use client"

import type { PropsWithChildren } from "react"
import { useSearchParams } from "next/navigation"

import { AssistantSidebar } from "@/components/assistant-ui/assistant-sidebar"

export function AskLayoutClient({ children }: PropsWithChildren) {
  const searchParams = useSearchParams()
  const planId = searchParams.get("p")

  if (!planId) {
    return children
  }

  return <AssistantSidebar>{children}</AssistantSidebar>
}
