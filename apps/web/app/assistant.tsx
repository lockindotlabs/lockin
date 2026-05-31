"use client"

import {
  AssistantRuntimeProvider,
  Suggestions,
  useAui,
  useThreadRuntime,
} from "@assistant-ui/react"
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk"
import { lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from "ai"
import { useEffect, useMemo, useRef } from "react"

import { Thread } from "@/components/thread"
import { WebSearchAssistantToolUI } from "@/components/web-search-tool-ui"
import {
  loadChatMessages,
  saveChatMessages,
} from "@/lib/chat/local-chat-persistence"
import { PlanAssistantTools } from "@/lib/plans/ai-plan-tools"
import { DevToolsFrame } from "@assistant-ui/react-devtools"

export function Assistant({
  mode = "onboarding",
  sessionKey,
  chatId,
  ensureChatId,
  initialMessages: persistedMessages,
  initialPrompt,
}: {
  mode?: "onboarding" | "plan"
  sessionKey: string
  chatId?: string
  ensureChatId?: () => Promise<string>
  initialMessages?: UIMessage[]
  initialPrompt?: string
}) {
  const chatIdRef = useRef(chatId)
  const ensureChatIdRef = useRef(ensureChatId)
  const ensureChatIdPromiseRef = useRef<Promise<string> | null>(null)

  useEffect(() => {
    chatIdRef.current = chatId
  }, [chatId])

  useEffect(() => {
    ensureChatIdRef.current = ensureChatId
  }, [ensureChatId])

  const initialMessages = useMemo(
    () => persistedMessages ?? loadChatMessages(sessionKey),
    [persistedMessages, sessionKey]
  )

  const runtime = useChatRuntime({
    id: chatId ?? sessionKey,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onFinish: ({ messages }) => {
      if (!chatIdRef.current && !ensureChatIdRef.current) {
        saveChatMessages(sessionKey, messages)
      }
    },
    transport: new AssistantChatTransport({
      api: "/api/chat",
      async prepareSendMessagesRequest({ messages, body }) {
        let requestChatId = chatIdRef.current
        const getChatId = ensureChatIdRef.current

        if (!requestChatId && getChatId) {
          ensureChatIdPromiseRef.current ??= getChatId().catch((error) => {
            ensureChatIdPromiseRef.current = null
            throw error
          })

          requestChatId = await ensureChatIdPromiseRef.current
          chatIdRef.current = requestChatId
        }

        if (!requestChatId) {
          return { body: { ...body, messages } }
        }

        const lastMessage = messages[messages.length - 1]

        return {
          body: {
            ...body,
            id: requestChatId,
            ...(lastMessage?.role === "user"
              ? { message: lastMessage }
              : { messages }),
          },
        }
      },
    }),
  })

  const aui = useAui({
    suggestions: Suggestions(
      mode === "plan"
        ? [
            "Make it smaller.",
            "I only have 45 minutes.",
            "Start with the easiest step.",
            "Make this for low energy.",
          ]
        : [
            "Finish my UX case study",
            "Study for finals",
            "Clean my room",
            "Build my portfolio",
          ]
    ),
  })

  return (
    <AssistantRuntimeProvider key={sessionKey} runtime={runtime} aui={aui}>
      <InitialPromptSender prompt={initialPrompt} sessionKey={sessionKey} />
      <PlanAssistantTools />
      <WebSearchAssistantToolUI />
      <Thread mode={mode} />
      {/* <DevToolsFrame className="min-h-200 w-full" /> */}
    </AssistantRuntimeProvider>
  )
}

const sentInitialPromptKeys = new Set<string>()

function InitialPromptSender({
  prompt,
  sessionKey,
}: {
  prompt?: string
  sessionKey: string
}) {
  const thread = useThreadRuntime()

  useEffect(() => {
    if (!prompt) {
      return
    }

    const sentKey = `${sessionKey}:${prompt}`
    if (sentInitialPromptKeys.has(sentKey)) {
      return
    }

    sentInitialPromptKeys.add(sentKey)
    thread.append({
      role: "user",
      content: [{ type: "text", text: prompt }],
    })
  }, [prompt, sessionKey, thread])

  return null
}

export default Assistant
