"use client"

import type { PropsWithChildren } from "react"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { Assistant } from "@/app/assistant"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { FeedbackPopover } from "../feedback-popover"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import {
  getChatTitle,
  loadChatMessages,
  subscribeToChatChanges,
} from "@/lib/chat/local-chat-persistence"
import { Button } from "@workspace/ui/components/button"
import { MoreHorizontalIcon } from "lucide-react"
import Link from "next/link"

export function AssistantSidebar({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { state } = useSidebar()
  const sessionKey = useMemo(() => {
    const chatSessionId = searchParams.get("id") ?? searchParams.get("t")

    if (pathname === "/app/ask" && chatSessionId) {
      return `ask:${chatSessionId}`
    }

    const queryString = searchParams.toString()
    return queryString ? `url:${pathname}?${queryString}` : `url:${pathname}`
  }, [pathname, searchParams])

  const [chatTitle, setChatTitle] = useState("New chat")

  useEffect(() => {
    const updateChatTitle = () => {
      setChatTitle(getChatTitle(loadChatMessages(sessionKey)))
    }

    updateChatTitle()

    return subscribeToChatChanges(updateChatTitle)
  }, [sessionKey])

  return (
    <ResizablePanelGroup className="h-full w-full" orientation="horizontal">
      <ResizablePanel defaultSize={40} minSize={"30%"} className="min-w-0">
        <div className="relative">
          <div className="absolute top-0 right-0 left-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background/80 backdrop-blur">
            <div className="flex flex-1 items-center gap-2 px-3 transition-transform duration-200 ease-in-out">
              <SidebarTrigger
                className={`${state == "expanded" && "pointer-events-none hidden opacity-0"} transition-all`}
              />

              <Breadcrumb className="ml-2">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      render={
                        <Link
                          href={`/app/ask?id=${sessionKey.split(":")[1]}`}
                        />
                      }
                    >
                      Ask
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      {sessionKey.includes("ask:") ? (
                        <div className="flex items-center gap-2">
                          {chatTitle}
                          <Button variant="ghost" size="icon-xs">
                            <MoreHorizontalIcon />
                          </Button>
                        </div>
                      ) : (
                        ""
                      )}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <Assistant key={sessionKey} mode="plan" sessionKey={sessionKey} />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60} minSize={"60%"} className="min-w-0">
        <div className="relative">
          {children}
          <div className="absolute right-5 bottom-5 z-10">
            <FeedbackPopover />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default AssistantSidebar
