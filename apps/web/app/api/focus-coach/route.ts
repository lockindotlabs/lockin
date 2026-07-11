import { google } from "@ai-sdk/google"
import { generateText } from "ai"

import { getCurrentDbUser } from "@/lib/server/current-db-user"

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

  const stepTitle = body.stepTitle?.trim() || "(không rõ tên bước)"
  const guidance = body.guidance?.trim()
  const planName = body.planName?.trim() || "(không rõ)"

  const prompt = [
    `Sprint: ${planName}`,
    `Bước người dùng đang làm: ${stepTitle}`,
    guidance ? `Gợi ý cách làm sẵn có của bước: ${guidance}` : undefined,
    "",
    `Câu hỏi của người dùng: ${question}`,
    "",
    "Hãy phản hồi theo đúng các nguyên tắc coach ở trên: chỉ gợi ý phương pháp/hướng đi, không đưa lời giải sẵn.",
  ]
    .filter((line) => line !== undefined)
    .join("\n")

  try {
    const { text } = await generateText({
      model: google(COACH_MODEL),
      system: COACH_SYSTEM_PROMPT,
      prompt,
    })

    return Response.json({ reply: text.trim() })
  } catch (err) {
    console.error("Focus coach generation failed:", err)
    return Response.json(
      { error: "Không tạo được phản hồi. Thử lại sau nhé." },
      { status: 500 }
    )
  }
}
