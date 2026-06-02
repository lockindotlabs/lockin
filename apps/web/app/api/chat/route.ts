import { frontendTools } from "@assistant-ui/react-ai-sdk"
import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google"
import { tavilySearch } from "@tavily/ai-sdk"
import {
  convertToModelMessages,
  createIdGenerator,
  stepCountIs,
  streamText,
  validateUIMessages,
  type UIMessage,
  type ToolSet,
} from "ai"

import {
  getOwnedChat,
  parseStoredMessages,
  saveChatMessages,
} from "@/lib/server/chat-store"
import { getCurrentDbUser } from "@/lib/server/current-db-user"
import prisma from "@workspace/db"

export const maxDuration = 30

type ChatConfig = {
  modelName?: string
  capabilities?: string[]
}

function isPendingToolPart(part: UIMessage["parts"][number]) {
  return (
    typeof part.type === "string" &&
    (part.type === "dynamic-tool" || part.type.startsWith("tool-")) &&
    "state" in part &&
    (part.state === "input-streaming" ||
      part.state === "input-available" ||
      part.state === "approval-requested")
  )
}

function removePendingToolCalls(messages: UIMessage[]) {
  return messages
    .map((message) => {
      if (message.role !== "assistant") {
        return message
      }

      return {
        ...message,
        parts: message.parts.filter((part) => !isPendingToolPart(part)),
      }
    })
    .filter((message) => message.role !== "assistant" || message.parts.length > 0)
}

export async function POST(req: Request) {
  const env = process.env as unknown as Record<string, string | undefined>
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const {
    id,
    message,
    messages: bodyMessages,
    system,
    tools,
    config,
  } = (await req.json()) as {
    id?: string
    message?: UIMessage
    messages?: UIMessage[]
    system?: string
    tools?: Parameters<typeof frontendTools>[0]
    config?: ChatConfig
  }

  if (!id) {
    return Response.json({ error: "Missing chat id." }, { status: 400 })
  }

  const capabilities = Array.isArray(config?.capabilities)
    ? config.capabilities
    : []
  const hasWebSearch = capabilities.includes("web-search")
  const hasComplexReasoning = capabilities.includes("complex-reasoning")

  const tavilyApiKey = env["TAVILY_API_KEY"]

  if (hasWebSearch && !tavilyApiKey) {
    return Response.json(
      {
        error:
          "Web search is enabled, but TAVILY_API_KEY is not configured on the server.",
      },
      { status: 400 }
    )
  }

  const serverTools: ToolSet = {}

  if (hasWebSearch) {
    serverTools.webSearch = tavilySearch({
      apiKey: tavilyApiKey,
      searchDepth: "advanced",
      includeAnswer: true,
      maxResults: 5,
    })
  }

  const frontendToolSet = frontendTools(tools ?? {}) as ToolSet
  const allTools: ToolSet = {
    ...frontendToolSet,
    ...serverTools,
  }
  const existingChat = await getOwnedChat(user.id, id)

  if (!existingChat) {
    return Response.json({ error: "Chat not found." }, { status: 404 })
  }

  const previousMessages = parseStoredMessages(existingChat.messages)
  const submittedMessages =
    Array.isArray(bodyMessages)
      ? bodyMessages
      : message != null
        ? [...previousMessages, message]
        : null

  if (!submittedMessages) {
    return Response.json({ error: "Missing chat message." }, { status: 400 })
  }

  const validatedMessages = await validateUIMessages({
    messages: removePendingToolCalls(submittedMessages),
  })

  await prisma.chat.update({
    where: { id },
    data: { status: "STREAMING" },
  })

  const result = streamText({
    model: google(config?.modelName || "gemini-3.1-flash-lite-preview"),
    providerOptions: hasComplexReasoning
      ? {
          google: {
            thinkingConfig: {
              thinkingLevel: "high",
              includeThoughts: true,
            },
          } satisfies GoogleLanguageModelOptions,
        }
      : {
          google: {
            thinkingConfig: {
              thinkingLevel: "medium",
              includeThoughts: true,
            },
          } satisfies GoogleLanguageModelOptions,
        },
    system: [
      system,
      hasWebSearch
        ? `Web search is available through the webSearch tool.
Use webSearch for current information, source-sensitive claims, external factual questions, or anything that may have changed recently.
When using webSearch, ground the answer in the search results and include relevant source links when available.`
        : undefined,
      `You can manage LockIn plans with frontend tools.
Use createPlan when the user asks to create, build, save, or start a new plan.
Use rewriteActivePlan when the user asks to revise, simplify, expand, reschedule, or otherwise rewrite the currently open plan.
Only use rewriteActivePlan for the active plan. If no plan is open, ask the user to open or create one first.
After createPlan or rewriteActivePlan succeeds, always send a text message. If the tool result includes confirmation, use that confirmation text exactly and do not add a longer summary. If a tool returns ok: false, explain the reason and ask for the next needed step.

You can ask bounded multiple-choice clarifying questions with the askChoicesBatch frontend tool.
Prefer askChoicesBatch for all clarification questions, including when you only need one question.
Use one askChoicesBatch call instead of multiple separate askChoice calls. Include 1-5 questions per batch, each with 2-6 mutually exclusive options.
Do not use askChoicesBatch for open-ended conversation. Use it instead of guessing when the next plan or task choice depends on the user's preference.
Wait for the batch result before asking another batch. After the tool returns, continue from the selected, custom, or skipped answers.
The older askChoice tool exists only for compatibility with existing conversations; do not prefer it for new clarifying questions.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    messages: await convertToModelMessages(validatedMessages, {
      tools: allTools,
      ignoreIncompleteToolCalls: true,
    }),
    tools: allTools,
    stopWhen: stepCountIs(5),
  })

  result.consumeStream({
    onError: () => {
      prisma.chat
        .update({
          where: { id },
          data: { status: "ERROR" },
        })
        .catch(() => {})
    },
  })

  return result.toUIMessageStreamResponse({
    originalMessages: validatedMessages,
    generateMessageId: createIdGenerator({
      prefix: "msg",
      size: 16,
    }),
    sendReasoning: true,
    onFinish: async ({ messages }) => {
      await saveChatMessages({
        id,
        userId: user.id,
        messages,
        status: "IDLE",
      })
    },
    messageMetadata: ({ part }) => {
      console.log(part)
      if (part.type === "finish") {
        return {
          usage: part.totalUsage,
        }
      }
      if (part.type === "finish-step") {
        return {
          modelId: part.response.modelId,
        }
      }
      return undefined
    },
  })
}
