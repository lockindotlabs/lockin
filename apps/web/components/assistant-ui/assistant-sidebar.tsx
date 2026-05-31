"use client"

import type { PropsWithChildren } from "react"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
  clearChatMessages,
  getChatTitle,
  loadChatMessages,
  subscribeToChatChanges,
} from "@/lib/chat/local-chat-persistence"
import { importDbChat, loadDbChat } from "@/lib/chat/db-chat-client"
import { Button } from "@workspace/ui/components/button"
import { ChevronDown, MoreHorizontalIcon } from "lucide-react"
import Link from "next/link"
import type { UIMessage } from "ai"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export function AssistantSidebar({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
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
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null
  )
  const chatSessionId = searchParams.get("id") ?? searchParams.get("t")
  const isAskChat = pathname === "/app/ask" && Boolean(chatSessionId)

  useEffect(() => {
    let isActive = true

    const updateChat = async () => {
      if (isAskChat && chatSessionId) {
        const chat = await loadDbChat(chatSessionId)
        if (!isActive) return

        if (chat) {
          setInitialMessages(chat.messages)
          setChatTitle(chat.title)
          return
        }

        const localMessages = loadChatMessages(sessionKey)
        if (localMessages.length > 0) {
          const imported = await importDbChat(chatSessionId, localMessages)
          if (!isActive) return

          clearChatMessages(sessionKey)
          setInitialMessages(imported.messages)
          setChatTitle(imported.title)
          return
        }

        setInitialMessages([])
        setChatTitle("New chat")
        return
      }

      const localMessages = loadChatMessages(sessionKey)
      setInitialMessages(localMessages)
      setChatTitle(getChatTitle(localMessages))
    }

    setInitialMessages(null)
    updateChat()

    const unsubscribe = subscribeToChatChanges(updateChat)

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [chatSessionId, isAskChat, sessionKey])

  return (
    <ResizablePanelGroup className="h-full w-full" orientation="horizontal">
      <ResizablePanel defaultSize={40} minSize={"35%"}>
        <div className="relative w-full">
          <div className="flex h-12 shrink-0 items-center gap-2">
            {" "}
            <div className="flex flex-1 items-center justify-between px-2 transition-transform duration-150 ease-in-out">
              <div className="flex items-center gap-2">
                <SidebarTrigger
                  className={`${state == "expanded" && "pointer-events-none hidden opacity-0"} transition-all`}
                />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        render={
                          <Button
                            variant={"ghost"}
                            size={"sm"}
                            className={"font-normal"}
                            onClick={() => {
                              router.push("/app/ask")
                            }}
                          />
                        }
                      >
                        Ask
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="line-clamp-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant={"ghost"}
                                size={"sm"}
                                className={"font-normal"}
                              >
                                {chatTitle}
                                <ChevronDown data-icon="inline-end" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent
                            align="start"
                            className="max-w-80"
                          >
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                Previous 7 days
                              </DropdownMenuLabel>
                              <DropdownMenuItem>{chatTitle}</DropdownMenuItem>
                              <DropdownMenuItem>
                                Create a new page
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Older</DropdownMenuLabel>
                              <DropdownMenuItem>
                                Capabilities overview
                              </DropdownMenuItem>
                              <DropdownMenuItem>Previous chat</DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
          </div>

          {initialMessages !== null ? (
            <Assistant
              key={sessionKey}
              mode="plan"
              sessionKey={sessionKey}
              chatId={isAskChat ? (chatSessionId ?? undefined) : undefined}
              initialMessages={initialMessages}
            />
          ) : null}
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60} minSize={"50%"}>
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
