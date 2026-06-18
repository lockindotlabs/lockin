"use client"

import type { PropsWithChildren } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Assistant } from "@/app/assistant"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarContent,
} from "@workspace/ui/components/sidebar"
import { RightSidebarContent } from "@/components/right-sidebar-context"
import {
  clearChatMessages,
  getChatTitle,
  loadChatMessages,
  subscribeToChatChanges,
} from "@/lib/chat/local-chat-persistence"
import {
  createDbChat,
  importDbChat,
  loadDbChat,
} from "@/lib/chat/db-chat-client"
import { Button } from "@workspace/ui/components/button"
import { ChevronDown } from "lucide-react"
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
import type { MentionRef } from "@/lib/mentions/mention-types"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { ClockRewind } from "@untitledui/icons"

type AssistantSidebarProps = PropsWithChildren<{
  activePlanId?: string
}>

function getPlanChatId(planId: string) {
  return `plan:${planId}`
}

export function AssistantSidebar({
  activePlanId,
  children,
}: AssistantSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { state } = useSidebar()
  const urlChatSessionId = searchParams.get("id") ?? searchParams.get("t")
  const isAskChat = pathname === "/app/ask" && Boolean(urlChatSessionId)
  const dbChatSessionId = isAskChat
    ? (urlChatSessionId ?? undefined)
    : activePlanId
      ? getPlanChatId(activePlanId)
      : undefined
  const sessionKey = useMemo(() => {
    if (dbChatSessionId) {
      return `chat:${dbChatSessionId}`
    }

    const queryString = searchParams.toString()
    return queryString ? `url:${pathname}?${queryString}` : `url:${pathname}`
  }, [dbChatSessionId, pathname, searchParams])

  const [chatTitle, setChatTitle] = useState("New chat")
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null
  )
  // The DB chat id confirmed to exist on the server. While the row doesn't
  // exist yet, Assistant gets no chatId and creates it lazily through
  // ensureChatId on the first message instead of on every panel open.
  const [readyDbChatId, setReadyDbChatId] = useState<string | null>(null)
  const createChatPromiseRef = useRef<Promise<string> | null>(null)
  const { plans } = usePlanSummaries()
  const activePlanTitle = activePlanId
    ? plans.find((plan) => plan.id === activePlanId)?.title
    : undefined
  const initialMentions = useMemo<MentionRef[]>(
    () =>
      activePlanId
        ? [
            {
              type: "current-plan",
              id: activePlanId,
              label: activePlanTitle?.trim() || "Current plan",
            },
          ]
        : [],
    [activePlanId, activePlanTitle]
  )

  useEffect(() => {
    createChatPromiseRef.current = null
  }, [dbChatSessionId])

  const ensureChatId = useCallback(async () => {
    if (dbChatSessionId) {
      createChatPromiseRef.current ??= createDbChat(dbChatSessionId)
        .then((chat) => chat.id)
        .catch((error) => {
          createChatPromiseRef.current = null
          throw error
        })

      return createChatPromiseRef.current
    }

    createChatPromiseRef.current ??= createDbChat()
      .then((chat) => chat.id)
      .catch((error) => {
        createChatPromiseRef.current = null
        throw error
      })

    return createChatPromiseRef.current
  }, [dbChatSessionId])

  useEffect(() => {
    let isActive = true

    const updateChat = async () => {
      if (dbChatSessionId) {
        const chat = await loadDbChat(dbChatSessionId)
        if (!isActive) return

        if (chat) {
          setReadyDbChatId(dbChatSessionId)
          setInitialMessages(chat.messages)
          setChatTitle(chat.title)
          return
        }

        const localMessages = loadChatMessages(sessionKey)
        if (localMessages.length > 0) {
          const imported = await importDbChat(dbChatSessionId, localMessages)
          if (!isActive) return

          clearChatMessages(sessionKey)
          setReadyDbChatId(dbChatSessionId)
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

    setReadyDbChatId(null)
    setInitialMessages(null)
    updateChat()

    const unsubscribe = subscribeToChatChanges(updateChat)

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [dbChatSessionId, sessionKey])

  return (
    <>
      <RightSidebarContent width="400px">
        <div className="b flex h-full w-full flex-col text-sidebar-foreground">
          <SidebarHeader className="flex h-12 shrink-0 flex-row items-center justify-between pl-0">
            <div className="flex items-center">
              <SidebarTrigger side="right" />

              <Breadcrumb>
                <BreadcrumbList>
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
                        <DropdownMenuContent align="start" className="max-w-80">
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

            <Button size={"icon-sm"} variant={"ghost"}>
              <ClockRewind />
            </Button>
          </SidebarHeader>

          <SidebarContent className="flex flex-1 flex-col overflow-hidden p-0">
            <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
              {initialMessages !== null ? (
                <Assistant
                  key={sessionKey}
                  mode="plan"
                  sessionKey={sessionKey}
                  chatId={
                    readyDbChatId === dbChatSessionId
                      ? dbChatSessionId
                      : undefined
                  }
                  ensureChatId={ensureChatId}
                  initialMessages={initialMessages}
                  initialMentions={initialMentions}
                />
              ) : null}
            </div>
          </SidebarContent>
        </div>
      </RightSidebarContent>
      {children}
    </>
  )
}

export default AssistantSidebar
