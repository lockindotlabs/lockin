"use client"

import type { PropsWithChildren } from "react"
import { useSearchParams } from "next/navigation"

import { AssistantSidebar } from "@/components/assistant-ui/assistant-sidebar"

export default function AskLayout({ children }: PropsWithChildren) {
  const searchParams = useSearchParams()
  const planId = searchParams.get("p")

  if (!planId) {
    return children
  }

  return <AssistantSidebar>{children}</AssistantSidebar>
}