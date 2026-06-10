import type { UIMessage } from "ai"
import prisma from "@workspace/db"

const NEW_CHAT_TITLE = "New chat"

function getMessageParts(message: UIMessage) {
  return "parts" in message && Array.isArray(message.parts) ? message.parts : []
}

function getMessageText(message: UIMessage) {
  return getMessageParts(message)
    .map((part) =>
      typeof part === "object" &&
      part !== null &&
      "type" in part &&
      part.type === "text" &&
      "text" in part &&
      typeof part.text === "string"
        ? part.text
        : ""
    )
    .join("")
    .trim()
}

export function getChatTitleFromMessages(messages: UIMessage[]) {
  const firstUserText = messages
    .filter((message) => message.role === "user")
    .map(getMessageText)
    .find((text) => text.length > 0)

  if (!firstUserText) {
    return NEW_CHAT_TITLE
  }

  return firstUserText.length > 42
    ? `${firstUserText.slice(0, 39).trim()}...`
    : firstUserText
}

export function parseStoredMessages(value: unknown): UIMessage[] {
  return Array.isArray(value) ? (value as UIMessage[]) : []
}

function toJsonMessages(messages: UIMessage[]) {
  return JSON.parse(JSON.stringify(messages))
}

export async function getOwnedChat(userId: string, id: string) {
  return prisma.chat.findFirst({
    where: { id, userId },
  })
}

export async function createChat(userId: string) {
  return prisma.chat.create({
    data: {
      userId,
      title: NEW_CHAT_TITLE,
      messages: [],
    },
  })
}

export async function saveChatMessages({
  id,
  userId,
  messages,
  status = "IDLE",
}: {
  id: string
  userId: string
  messages: UIMessage[]
  status?: "IDLE" | "STREAMING" | "ERROR"
}) {
  const existing = await getOwnedChat(userId, id)
  const nextTitle =
    !existing || existing.title === NEW_CHAT_TITLE
      ? getChatTitleFromMessages(messages)
      : existing.title

  return prisma.chat.upsert({
    where: { id },
    update: {
      messages: toJsonMessages(messages),
      title: nextTitle,
      status,
    },
    create: {
      id,
      userId,
      title: nextTitle,
      messages: toJsonMessages(messages),
      status,
    },
  })
}
