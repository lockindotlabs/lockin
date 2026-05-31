"use client"

import type { UIMessage } from "ai"

import { notifyChatChanged, type ChatSummary } from "./local-chat-persistence"

export type StoredChat = {
  id: string
  title: string
  messages: UIMessage[]
  updatedAt: string
  status: "IDLE" | "STREAMING" | "ERROR"
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function createDbChat(id?: string) {
  const response = await fetch("/api/chats", {
    method: "POST",
    headers: id ? { "Content-Type": "application/json" } : undefined,
    body: id ? JSON.stringify({ id }) : undefined,
  })
  const chat = await parseResponse<{ id: string }>(response)
  notifyChatChanged()
  return chat
}

export async function loadDbChat(id: string) {
  const response = await fetch(`/api/chats/${encodeURIComponent(id)}`)

  if (response.status === 404) {
    return null
  }

  return parseResponse<StoredChat>(response)
}

export async function importDbChat(id: string, messages: UIMessage[]) {
  const response = await fetch("/api/chats/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, messages }),
  })

  const chat = await parseResponse<StoredChat>(response)
  notifyChatChanged()
  return chat
}

export async function listDbChats() {
  const response = await fetch("/api/chats")
  const data = await parseResponse<{ chats: ChatSummary[] }>(response)

  return data.chats
}

export async function renameDbChat(id: string, title: string) {
  const response = await fetch(`/api/chats/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })

  const chat = await parseResponse<
    Pick<StoredChat, "id" | "title" | "updatedAt" | "status">
  >(
    response
  )
  notifyChatChanged()
  return chat
}

export async function deleteDbChat(id: string) {
  const response = await fetch(`/api/chats/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  notifyChatChanged()
}
