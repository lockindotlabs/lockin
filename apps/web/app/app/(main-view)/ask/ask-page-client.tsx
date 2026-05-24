"use client"

import { Assistant } from "@/app/assistant"
import PlanEditor from "@/app/app/(main-view)/(editor)/plan/PlanEditor"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { RedirectToSignIn, Show, UserButton } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import {
  getChatTitle,
  loadChatMessages,
  subscribeToChatChanges,
} from "@/lib/chat/local-chat-persistence"
import { Button } from "@workspace/ui/components/button"
import { MoreHorizontalIcon, XIcon } from "lucide-react"

export function AskPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatSessionId = searchParams.get("id") ?? searchParams.get("t")
  const planId = searchParams.get("p")
  const { state } = useSidebar()
  const [chatTitle, setChatTitle] = useState("New chat")

  useEffect(() => {
    if (chatSessionId) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("id", crypto.randomUUID())
    router.replace(`/app/ask?${nextParams.toString()}`)
  }, [chatSessionId, router, searchParams])

  useEffect(() => {
    if (!chatSessionId || planId) {
      return
    }

    const sessionKey = `ask:${chatSessionId}`

    const updateChatTitle = () => {
      setChatTitle(getChatTitle(loadChatMessages(sessionKey)))
    }

    updateChatTitle()

    return subscribeToChatChanges(updateChatTitle)
  }, [chatSessionId, planId])

  if (!chatSessionId) {
    return null
  }

  const closeEditor = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete("p")

    router.push(`/app/ask?${nextParams.toString()}`)
  }

  if (planId) {
    return (
      <div className="relative h-screen">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 left-2.5 z-20 bg-background"
          aria-label="Close editor"
          onClick={closeEditor}
        >
          <XIcon />
        </Button>
        <PlanEditor planId={planId} />
      </div>
    )
  }

  return (
    <div className="relative flex flex-col">
      <div className="absolute top-0 right-0 left-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background/80 backdrop-blur">
        <div className="flex flex-1 items-center gap-2 px-3 transition-transform duration-200 ease-in-out">
          <SidebarTrigger
            className={`${state == "expanded" && "pointer-events-none hidden opacity-0"} transition-all`}
          />
          <Breadcrumb className="ml-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/app" />}>
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/app/ask" />}>
                  Ask
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  <div className="flex items-center gap-2">
                    {chatTitle}
                    <Button variant="ghost" size="icon-xs">
                      <MoreHorizontalIcon />
                    </Button>
                  </div>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="ml-auto flex items-center gap-2 px-3">
          <Show when="signed-in">
            <UserButton />
          </Show>

          <Show when="signed-out">
            <RedirectToSignIn />
          </Show>
        </div>
      </div>
      <Show when="signed-in">
        <Assistant
          key={chatSessionId}
          mode="onboarding"
          sessionKey={`ask:${chatSessionId}`}
        />
      </Show>
    </div>
  )
}
