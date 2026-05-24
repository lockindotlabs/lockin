"use client"

import type { UIMessage } from "ai"

const STORAGE_PREFIX = "lockin:chat:v1"
const CHAT_INDEX_KEY = "lockin:chat:index:v1"
const CHAT_CHANGE_EVENT = "lockin:chat-changed"

export type ChatSummary = {
  id: string
  sessionKey: string
  title: string
  updatedAt: string
  messageCount: number
}

export function getChatStorageKey(sessionKey: string) {
  return `${STORAGE_PREFIX}:${sessionKey}`
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

function emitChatChanges() {
  if (typeof window === "undefined") return

  window.dispatchEvent(new Event(CHAT_CHANGE_EVENT))
}

function readChatIndex() {
  if (!canUseStorage()) return []

  try {
    const value = window.localStorage.getItem(CHAT_INDEX_KEY)
    const parsed = value ? JSON.parse(value) : []

    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is { sessionKey: string; updatedAt: string } =>
            typeof item === "object" &&
            item !== null &&
            "sessionKey" in item &&
            typeof item.sessionKey === "string" &&
            "updatedAt" in item &&
            typeof item.updatedAt === "string"
        )
      : []
  } catch {
    return []
  }
}

function writeChatIndex(
  entries: {
    sessionKey: string
    updatedAt: string
  }[]
) {
  if (!canUseStorage()) return

  window.localStorage.setItem(CHAT_INDEX_KEY, JSON.stringify(entries))
}

function touchChatIndex(sessionKey: string) {
  const updatedAt = new Date().toISOString()
  const entries = readChatIndex().filter(
    (item) => item.sessionKey !== sessionKey
  )

  writeChatIndex([{ sessionKey, updatedAt }, ...entries])
}

function removeFromChatIndex(sessionKey: string) {
  writeChatIndex(
    readChatIndex().filter((item) => item.sessionKey !== sessionKey)
  )
}

function getChatSessionId(sessionKey: string) {
  return sessionKey.startsWith("ask:") ? sessionKey.slice(4) : sessionKey
}

function getSessionKeyFromStorageKey(storageKey: string) {
  return storageKey.startsWith(`${STORAGE_PREFIX}:`)
    ? storageKey.slice(STORAGE_PREFIX.length + 1)
    : ""
}

function getMessageParts(message: UIMessage) {
  if (!("parts" in message) || !Array.isArray(message.parts)) {
    return []
  }

  return message.parts
}

function getMessageText(message: UIMessage) {
  return getMessageParts(message)
    .map((part) => {
      if (
        typeof part === "object" &&
        part !== null &&
        "type" in part &&
        part.type === "text" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text
      }

      return ""
    })
    .join("")
    .trim()
}

export function getChatTitle(messages: UIMessage[]) {
  const firstUserText = messages
    .filter((message) => message.role === "user")
    .map(getMessageText)
    .find((text) => text.length > 0)

  if (!firstUserText) {
    return "New chat"
  }

  return firstUserText.length > 42
    ? `${firstUserText.slice(0, 39).trim()}...`
    : firstUserText
}

export function loadChatMessages(sessionKey: string): UIMessage[] {
  if (!canUseStorage()) return []

  try {
    const rawMessages = window.localStorage.getItem(
      getChatStorageKey(sessionKey)
    )
    if (!rawMessages) return []

    const messages = JSON.parse(rawMessages)
    return Array.isArray(messages) ? messages : []
  } catch {
    return []
  }
}

export function saveChatMessages(sessionKey: string, messages: UIMessage[]) {
  if (!canUseStorage()) return

  window.localStorage.setItem(
    getChatStorageKey(sessionKey),
    JSON.stringify(messages)
  )
  touchChatIndex(sessionKey)
  emitChatChanges()
}

export function clearChatMessages(sessionKey: string) {
  if (!canUseStorage()) return

  window.localStorage.removeItem(getChatStorageKey(sessionKey))
  removeFromChatIndex(sessionKey)
  emitChatChanges()
}

export function listChatSummaries(): ChatSummary[] {
  if (!canUseStorage()) return []

  const indexedUpdatedAt = new Map(
    readChatIndex().map((item) => [item.sessionKey, item.updatedAt])
  )
  const sessionKeys = new Set(indexedUpdatedAt.keys())

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index)

    if (!storageKey?.startsWith(`${STORAGE_PREFIX}:ask:`)) {
      continue
    }

    const sessionKey = getSessionKeyFromStorageKey(storageKey)
    sessionKeys.add(sessionKey)
  }

  const summaries: ChatSummary[] = []

  sessionKeys.forEach((sessionKey) => {
    const messages = loadChatMessages(sessionKey)

    if (messages.length === 0) {
      return
    }

    summaries.push({
      id: getChatSessionId(sessionKey),
      sessionKey,
      title: getChatTitle(messages),
      updatedAt: indexedUpdatedAt.get(sessionKey) ?? "",
      messageCount: messages.length,
    })
  })

  return summaries
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 10)
}

export function subscribeToChatChanges(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(`${STORAGE_PREFIX}:`) ?? false) {
      listener()
    }

    if (event.key === CHAT_INDEX_KEY) {
      listener()
    }
  }

  window.addEventListener(CHAT_CHANGE_EVENT, listener)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(CHAT_CHANGE_EVENT, listener)
    window.removeEventListener("storage", handleStorage)
  }
}
