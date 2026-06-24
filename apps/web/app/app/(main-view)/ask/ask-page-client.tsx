"use client"

import { Assistant } from "@/app/assistant"
import PlanEditor from "@/app/app/(main-view)/(editor)/plan/PlanEditor"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import {
  clearChatMessages,
  loadChatMessages,
  subscribeToChatChanges,
} from "@/lib/chat/local-chat-persistence"
import { consumePendingAskPrompt } from "@/lib/chat/pending-ask-prompt"
import { useChatSummaries } from "@/lib/chat/use-chat-summaries"
import { buildAskHref } from "@/lib/routing/ask-url"
import {
  createDbChat,
  importDbChat,
  loadDbChat,
  renameDbChat,
  deleteDbChat,
} from "@/lib/chat/db-chat-client"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"
import { ChevronDown, MoreHorizontalIcon, Plus, XIcon } from "lucide-react"
import type { UIMessage } from "ai"
import { HeaderLeft, HeaderRight } from "@/components/header-context"
import { ClockRewind } from "@untitledui/icons"

export function AskPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatSessionId = searchParams.get("id") ?? searchParams.get("t")
  const planId = searchParams.get("p")
  const { state } = useSidebar()
  const [chatTitle, setChatTitle] = useState("New chat")
  const [createdDraftChatId, setCreatedDraftChatId] = useState<string>()
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null
  )
  const [initialPrompt, setInitialPrompt] = useState<string>()
  const createDraftChatPromiseRef = useRef<Promise<string> | null>(null)
  const effectiveChatId = chatSessionId ?? createdDraftChatId

  const { chats } = useChatSummaries()

  const handleChatSelect = (chatId: string) => {
    router.push(buildAskHref({ chatSessionId: chatId }))
  }

  const { todayChats, yesterdayChats, previousSevenDaysChats, olderChats } =
    useMemo(() => {
      const now = new Date()
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime()
      const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
      const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000

      const today: typeof chats = []
      const yesterday: typeof chats = []
      const sevenDays: typeof chats = []
      const older: typeof chats = []

      chats.forEach((chat) => {
        const time = chat.updatedAt ? new Date(chat.updatedAt).getTime() : 0
        if (!time) {
          older.push(chat)
        } else if (time >= todayStart) {
          today.push(chat)
        } else if (time >= yesterdayStart) {
          yesterday.push(chat)
        } else if (time >= sevenDaysAgoStart) {
          sevenDays.push(chat)
        } else {
          older.push(chat)
        }
      })

      return {
        todayChats: today,
        yesterdayChats: yesterday,
        previousSevenDaysChats: sevenDays,
        olderChats: older,
      }
    }, [chats])

  useEffect(() => {
    if (!chatSessionId) {
      setInitialMessages([])
      setChatTitle("New chat")
      setInitialPrompt(undefined)
      return
    }

    let isActive = true

    const loadChat = async () => {
      const chat = await loadDbChat(chatSessionId)
      if (!isActive) return

      if (chat) {
        setInitialMessages(chat.messages)
        setChatTitle(chat.title)
        setInitialPrompt(consumePendingAskPrompt(chatSessionId))
        return
      }

      const sessionKey = `ask:${chatSessionId}`
      const localMessages = loadChatMessages(sessionKey)

      if (localMessages.length > 0) {
        const imported = await importDbChat(chatSessionId, localMessages)
        if (!isActive) return

        clearChatMessages(sessionKey)
        setInitialMessages(imported.messages)
        setChatTitle(imported.title)
        setInitialPrompt(consumePendingAskPrompt(imported.id))
        return
      }

      const created = await createDbChat(chatSessionId)
      if (!isActive) return

      const nextParams = new URLSearchParams(searchParams)
      nextParams.set("id", created.id)
      router.replace(`/app/ask?${nextParams.toString()}`)
    }

    setInitialMessages(null)
    loadChat()

    return () => {
      isActive = false
    }
  }, [chatSessionId, router, searchParams])

  useEffect(() => {
    if (!effectiveChatId) {
      return
    }

    let isActive = true
    const unsubscribe = subscribeToChatChanges(async () => {
      const chat = await loadDbChat(effectiveChatId)
      if (!isActive || !chat) return

      setChatTitle(chat.title)
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [effectiveChatId])

  const ensureChatId = useCallback(async () => {
    if (chatSessionId) {
      return chatSessionId
    }

    if (createDraftChatPromiseRef.current) {
      return createDraftChatPromiseRef.current
    }

    createDraftChatPromiseRef.current = (async () => {
      const nextId = crypto.randomUUID()
      const created = await createDbChat(nextId)
      const nextParams = new URLSearchParams(window.location.search)
      nextParams.set("id", created.id)

      window.history.replaceState(
        window.history.state,
        "",
        `/app/ask?${nextParams.toString()}`
      )
      setCreatedDraftChatId(created.id)

      return created.id
    })().catch((error) => {
      createDraftChatPromiseRef.current = null
      throw error
    })

    return createDraftChatPromiseRef.current
  }, [chatSessionId])

  if (initialMessages === null) {
    return null
  }

  const closeEditor = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete("p")

    router.push(`/app/ask?${nextParams.toString()}`)
  }

  const renameChat = async () => {
    if (!effectiveChatId) {
      return
    }

    const nextTitle = window.prompt("Rename chat", chatTitle)?.trim()

    if (!nextTitle) {
      return
    }

    const chat = await renameDbChat(effectiveChatId, nextTitle)
    setChatTitle(chat.title)
  }

  const deleteChat = async () => {
    if (!effectiveChatId) {
      return
    }

    const shouldDelete = window.confirm(`Delete "${chatTitle}"?`)

    if (!shouldDelete) {
      return
    }

    await deleteDbChat(effectiveChatId)
    setCreatedDraftChatId(undefined)
    createDraftChatPromiseRef.current = null
    router.replace("/app/ask")
  }

  if (planId) {
    return (
      <div className="relative h-full">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 left-2.5 z-20 bg-background"
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
    <>
      {effectiveChatId && (
        <>
          <HeaderLeft>
            <Breadcrumb className="-translate-x-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Button
                        variant={"ghost"}
                        size={"sm"}
                        className={"h-8 px-2 font-normal"}
                        onClick={() => {
                          router.push("/app")
                        }}
                      />
                    }
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Button
                        variant={"ghost"}
                        size={"sm"}
                        className={"h-8 px-2 font-normal"}
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
                            className={"h-8 px-2 font-normal"}
                          >
                            {chatTitle}
                            <ChevronDown className="ml-1 size-3.5 opacity-70" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent
                        align="start"
                        className="max-w-100 min-w-64"
                      >
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => router.push(buildAskHref())}
                            className="flex items-center gap-2 font-medium"
                          >
                            <Plus className="size-4" />
                            New chat
                          </DropdownMenuItem>
                        </DropdownMenuGroup>

                        {chats.length === 0 ? (
                          <>
                            <DropdownMenuSeparator />
                            <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                              No recent chats
                            </div>
                          </>
                        ) : (
                          <>
                            {todayChats.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>Today</DropdownMenuLabel>
                                  {todayChats.map((chat) => (
                                    <DropdownMenuItem
                                      key={chat.id}
                                      onClick={() => handleChatSelect(chat.id)}
                                      className="truncate"
                                    >
                                      {chat.title || "New chat"}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuGroup>
                              </>
                            )}

                            {yesterdayChats.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>
                                    Yesterday
                                  </DropdownMenuLabel>
                                  {yesterdayChats.map((chat) => (
                                    <DropdownMenuItem
                                      key={chat.id}
                                      onClick={() => handleChatSelect(chat.id)}
                                      className="truncate"
                                    >
                                      {chat.title || "New chat"}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuGroup>
                              </>
                            )}

                            {previousSevenDaysChats.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>
                                    Previous 7 days
                                  </DropdownMenuLabel>
                                  {previousSevenDaysChats.map((chat) => (
                                    <DropdownMenuItem
                                      key={chat.id}
                                      onClick={() => handleChatSelect(chat.id)}
                                      className="truncate"
                                    >
                                      {chat.title || "New chat"}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuGroup>
                              </>
                            )}

                            {olderChats.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>Older</DropdownMenuLabel>
                                  {olderChats.map((chat) => (
                                    <DropdownMenuItem
                                      key={chat.id}
                                      onClick={() => handleChatSelect(chat.id)}
                                      className="truncate"
                                    >
                                      {chat.title || "New chat"}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuGroup>
                              </>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-xs" />}
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={renameChat}>Rename</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={deleteChat}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </HeaderLeft>
        </>
      )}
      {/* Sidebar */}
      {/* <div className="flex h-12 shrink-0 items-center gap-2">
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
                          router.push("/app")
                        }}
                      />
                    }
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
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
                      <DropdownMenuContent align="start" className="max-w-80">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Previous 7 days</DropdownMenuLabel>
                          <DropdownMenuItem>{chatTitle}</DropdownMenuItem>
                          <DropdownMenuItem>Create a new page</DropdownMenuItem>
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

          {effectiveChatId ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-xs" />}
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={renameChat}>Rename</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={deleteChat}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <Show when="signed-out">
          <RedirectToSignIn />
        </Show>
      </div> */}
      <Assistant
        key={chatSessionId ?? "draft"}
        mode="onboarding"
        sessionKey={chatSessionId ? `ask:${chatSessionId}` : "ask:draft"}
        chatId={chatSessionId ?? undefined}
        ensureChatId={ensureChatId}
        initialMessages={initialMessages}
        initialPrompt={initialPrompt}
      />
    </>
  )
}
