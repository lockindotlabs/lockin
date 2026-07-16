import { google } from "@ai-sdk/google"
import { generateText } from "ai"

import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { getRequestLocale } from "@/lib/server/request-locale"
import type { AppLocale } from "@workspace/i18n"

export const maxDuration = 30

const COACH_MODEL = "gemini-3.1-flash-lite-preview"

// Focus coach: guides the user on HOW to approach the step they're stuck on,
// and refuses to hand over the actual answer/content. It is deliberately narrow
// — only methods, directions, and approaches tied to the current step.
const COACH_SYSTEM_PROMPT = `Bạn là "Coach" của LockIn — trợ lý đồng hành trong lúc người dùng đang tập trung (focus sprint) làm một bước cụ thể.

Nguyên tắc TUYỆT ĐỐI:
1. CHỈ gợi ý phương pháp, hướng tiếp cận, cách bắt đầu, cách gỡ kẹt liên quan tới bước hiện tại và câu hỏi của người dùng.
2. TUYỆT ĐỐI KHÔNG đưa ra lời giải, đáp án, nội dung, văn bản, code, hay kết quả làm sẵn thay người dùng. Nếu người dùng hỏi xin lời giải trực tiếp ("viết hộ", "cho đáp án", "code luôn giúp"), hãy lịch sự TỪ CHỐI và chuyển sang gợi ý cách để họ TỰ làm.
3. Không giảng lý thuyết dài dòng. Trả lời ngắn gọn 2-4 câu, giọng khích lệ, cụ thể, gắn với bước hiện tại.
4. Nếu câu hỏi nằm ngoài phạm vi bước hiện tại hoặc không liên quan tới việc thực thi bước, nhẹ nhàng kéo người dùng quay lại bước đang làm.
5. Trả lời bằng tiếng Việt.`

const COACH_SYSTEM_PROMPTS: Record<AppLocale, string> = {
  vi: COACH_SYSTEM_PROMPT,
  en: `You are LockIn's "Coach" — a companion assistant while the user is in a focus sprint working on one specific step.

Absolute rules:
1. ONLY suggest methods, approaches, ways to start, or ways to get unstuck that relate to the current step and the user's question.
2. NEVER provide the actual solution, answer, finished content, finished text, code, or completed result on the user's behalf. If the user directly asks for the answer ("write it for me", "give me the answer", "code it for me"), politely refuse and redirect to how they can do it themselves.
3. Do not lecture at length. Reply in 2-4 concise sentences, encouraging, concrete, and tied to the current step.
4. If the question is outside the current step or unrelated to executing it, gently steer the user back to the step they are working on.
5. Reply in English.`,
}

const COACH_COPY: Record<
  AppLocale,
  {
    unknownPlan: string
    unknownStep: string
    stepLine: (stepTitle: string) => string
    guidanceLine: (guidance: string) => string
    questionLine: (question: string) => string
    finalInstruction: string
    generationError: string
  }
> = {
  vi: {
    unknownPlan: "(không rõ)",
    unknownStep: "(không rõ tên bước)",
    stepLine: (stepTitle) => `Bước người dùng đang làm: ${stepTitle}`,
    guidanceLine: (guidance) => `Gợi ý cách làm sẵn có của bước: ${guidance}`,
    questionLine: (question) => `Câu hỏi của người dùng: ${question}`,
    finalInstruction:
      "Hãy phản hồi theo đúng các nguyên tắc coach ở trên: chỉ gợi ý phương pháp/hướng đi, không đưa lời giải sẵn.",
    generationError: "Không tạo được phản hồi. Thử lại sau nhé.",
  },
  en: {
    unknownPlan: "(unknown)",
    unknownStep: "(unknown step)",
    stepLine: (stepTitle) => `Current step: ${stepTitle}`,
    guidanceLine: (guidance) => `Existing step guidance: ${guidance}`,
    questionLine: (question) => `User question: ${question}`,
    finalInstruction:
      "Respond according to the coach rules above: suggest only methods or direction, and do not provide a finished answer.",
    generationError: "Could not generate a response. Try again later.",
  },
}

type CoachRequestBody = {
  question?: string
  stepTitle?: string
  guidance?: string | null
  planName?: string | null
}

export async function POST(req: Request) {
  const user = await getCurrentDbUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const locale = await getRequestLocale(req, user.id)
  const copy = COACH_COPY[locale]

  let body: CoachRequestBody
  try {
    body = (await req.json()) as CoachRequestBody
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const question = body.question?.trim()
  if (!question) {
    return Response.json({ error: "Missing question." }, { status: 400 })
  }

  const stepTitle = body.stepTitle?.trim() || copy.unknownStep
  const guidance = body.guidance?.trim()
  const planName = body.planName?.trim() || copy.unknownPlan

  const prompt = [
    `Sprint: ${planName}`,
    copy.stepLine(stepTitle),
    guidance ? copy.guidanceLine(guidance) : undefined,
    "",
    copy.questionLine(question),
    "",
    copy.finalInstruction,
  ]
    .filter((line) => line !== undefined)
    .join("\n")

  try {
    const { text } = await generateText({
      model: google(COACH_MODEL),
      system: COACH_SYSTEM_PROMPTS[locale],
      prompt,
    })

    return Response.json({ reply: text.trim() })
  } catch (err) {
    console.error("Focus coach generation failed:", err)
    return Response.json({ error: copy.generationError }, { status: 500 })
  }
}
