"use client"

import * as React from "react"

import {
  subscribeToChatChanges,
  type ChatSummary,
} from "./local-chat-persistence"
import { listDbChats } from "./db-chat-client"

export function useChatSummaries() {
  const [chats, setChats] = React.useState<ChatSummary[]>([])
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    let isActive = true

    const loadChats = () => {
      if (!isActive) {
        return
      }

      listDbChats()
        .then((nextChats) => {
          if (!isActive) {
            return
          }

          setChats(nextChats)
          setIsLoaded(true)
        })
        .catch(() => {
          if (!isActive) {
            return
          }

          setChats([])
          setIsLoaded(true)
        })
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
