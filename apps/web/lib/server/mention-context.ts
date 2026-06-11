import type { UIMessage } from "ai"

import type { MentionRef } from "@/lib/mentions/mention-types"
import { getMentionKey, isMentionRef } from "@/lib/mentions/mention-types"
import { getOwnedChat, parseStoredMessages } from "@/lib/server/chat-store"
import { getOwnedPlan } from "@/lib/server/plan-store"

type ResolveMentionContextOptions = {
  userId: string
  requestChatId: string
  mentions?: unknown
}

const MAX_MENTIONS = 8
const MAX_CHAT_MESSAGES = 8
const MAX_TEXT_LENGTH = 1200

function truncateText(value: string, maxLength = MAX_TEXT_LENGTH) {
  const normalized = value.replace(/\s+/g, " ").trim()
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3).trim()}...`
    : normalized
}

function getMessageText(message: UIMessage) {
  return message.parts
    .map((part) =>
      part.type === "text" && typeof part.text === "string" ? part.text : ""
    )
    .join("")
    .trim()
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeek(value: Date) {
  const next = new Date(value)
  const day = next.getDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + diff)
  return next
}

function formatDateMention(mention: MentionRef) {
  const today = new Date()

  if (mention.id === "today") {
    return `Date: Today (${formatDate(today)})`
  }

  if (mention.id === "tomorrow") {
    return `Date: Tomorrow (${formatDate(addDays(today, 1))})`
  }

  if (mention.id === "yesterday") {
    return `Date: Yesterday (${formatDate(addDays(today, -1))})`
  }

  if (mention.id === "this-week") {
    const start = startOfWeek(today)
    const end = addDays(start, 6)
    return `Date range: This week (${formatDate(start)} to ${formatDate(end)})`
  }

  return `Date reference: ${mention.label}`
}

async function formatPlanMention(userId: string, planId: string) {
  const plan = await getOwnedPlan(userId, planId)

  if (!plan) {
    return null
  }

  const steps = plan.steps
    .map((step, index) => {
      const dueDate = step.dueDate
        ? `, due ${step.dueDate.toISOString().slice(0, 10)}`
        : ""
      const description = step.description
        ? ` - ${truncateText(step.description, 260)}`
        : ""

      return `${index + 1}. ${step.title}${description} (${step.status}, ${step.estimatedMinutes} min${dueDate})`
    })
    .join("\n")

  return [
    `Plan: ${plan.name}`,
    plan.description ? `Description: ${truncateText(plan.description)}` : null,
    plan.completion ? `Completion target: ${truncateText(plan.completion)}` : null,
    steps ? `Steps:\n${steps}` : "Steps: none",
  ]
    .filter(Boolean)
    .join("\n")
}

async function formatChatMention(userId: string, chatId: string) {
  const chat = await getOwnedChat(userId, chatId)

  if (!chat) {
    return null
  }

  const messages = parseStoredMessages(chat.messages)
    .map((message) => {
      const text = getMessageText(message)

      return text ? `${message.role}: ${truncateText(text, 500)}` : null
    })
    .filter(Boolean)
    .slice(-MAX_CHAT_MESSAGES)

  return [
    `Chat: ${chat.title}`,
    messages.length > 0 ? `Recent messages:\n${messages.join("\n")}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

function getNormalizedMentions(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const mentions: MentionRef[] = []

  for (const item of value) {
    if (!isMentionRef(item)) {
      continue
    }

    const key = getMentionKey(item)

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    mentions.push(item)

    if (mentions.length >= MAX_MENTIONS) {
      break
    }
  }

  return mentions
}

export async function resolveMentionContext({
  userId,
  requestChatId,
  mentions,
}: ResolveMentionContextOptions) {
  const normalizedMentions = getNormalizedMentions(mentions)
  const sections: string[] = []

  for (const mention of normalizedMentions) {
    if (mention.type === "date") {
      sections.push(formatDateMention(mention))
      continue
    }

    if (mention.type === "current-thread") {
      const section = await formatChatMention(userId, requestChatId)
      if (section) sections.push(section)
      continue
    }

    if (mention.type === "chat") {
      const section = await formatChatMention(userId, mention.id)
      if (section) sections.push(section)
      continue
    }

    if (mention.type === "plan" || mention.type === "current-plan") {
      const section = await formatPlanMention(userId, mention.id)
      if (section) sections.push(section)
    }
  }

  if (sections.length === 0) {
    return undefined
  }

  return `Mentioned context for this request. Use this context only when it is relevant to the user's prompt, and do not claim access to unresolved mentions.\n\n${sections
    .map((section, index) => `## Mention ${index + 1}\n${section}`)
    .join("\n\n")}`
}
