import { frontendTools } from "@assistant-ui/react-ai-sdk"
import { google } from "@ai-sdk/google"
import { convertToModelMessages, stepCountIs, streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json()

  const result = streamText({
    model: google("gemini-3.1-flash-lite"),
    system: [
      system,
      `You can manage LockIn plans with frontend tools.
Use createPlan when the user asks to create, build, save, or start a new plan.
Use rewriteActivePlan when the user asks to revise, simplify, expand, reschedule, or otherwise rewrite the currently open plan.
Only use rewriteActivePlan for the active plan. If no plan is open, ask the user to open or create one first.
After createPlan or rewriteActivePlan succeeds, always send a final assistant text message. If the tool result includes confirmation, use that confirmation text exactly and do not add a longer summary. If a tool returns ok: false, explain the reason and ask for the next needed step.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    messages: await convertToModelMessages(messages),
    tools: frontendTools(tools ?? {}),
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
