"use client"

import * as React from "react"

import {
  listChatSummaries,
  subscribeToChatChanges,
  type ChatSummary,
} from "./local-chat-persistence"

export function useChatSummaries() {
  const [chats, setChats] = React.useState<ChatSummary[]>([])
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    let isActive = true

    const loadChats = () => {
      if (!isActive) {
        return
      }

      setChats(listChatSummaries())
      setIsLoaded(true)
    }

    loadChats()
    const unsubscribe = subscribeToChatChanges(loadChats)

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  return { chats, isLoaded }
}
