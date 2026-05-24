"use client"

import {
  AssistantRuntimeProvider,
  Suggestions,
  useAui,
} from "@assistant-ui/react"
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk"
import { useMemo } from "react"

import { Thread } from "@/components/thread"
import {
  loadChatMessages,
  saveChatMessages,
} from "@/lib/chat/local-chat-persistence"
import { PlanAssistantTools } from "@/lib/plans/ai-plan-tools"

export function Assistant({
  mode = "onboarding",
  sessionKey,
}: {
  mode?: "onboarding" | "plan"
  sessionKey: string
}) {
  const initialMessages = useMemo(
    () => loadChatMessages(sessionKey),
    [sessionKey]
  )

  const runtime = useChatRuntime({
    id: sessionKey,
    messages: initialMessages,
    onFinish: ({ messages }) => {
      saveChatMessages(sessionKey, messages)
    },
    transport: new AssistantChatTransport({
      api: "/api/chat",
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
      <PlanAssistantTools />
      <Thread mode={mode} />
    </AssistantRuntimeProvider>
  )
}

export default Assistant
