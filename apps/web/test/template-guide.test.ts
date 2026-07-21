import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { formatCustomRequirementsForPrompt } from "../lib/server/template-context"
import { TemplateDraftInputSchema } from "../lib/server/template-schemas"
import { calculateRetroMinutes } from "../lib/templates/template-guide"

const validTemplate = {
  title: "Template học tập",
  category: "user-template",
  description: "Dành cho sinh viên cần chia bài tập lớn thành sprint.",
  goalTemplate: "Hoàn thành {bài tập} với {bản nộp cụ thể} sẵn sàng gửi đi.",
  isAcademic: false,
  domainTags: ["study"],
  outputType: "PROJECT",
  supportsGroupMode: false,
  priceVnd: null,
  steps: [
    {
      title: "Viết dàn ý",
      guidance: "Sau khi đọc đề, viết 3 ý chính trước.",
      estimatedMinutes: 30,
    },
  ],
  scaffoldQuestions: [
    {
      prompt: "Kết thúc sprint này, bạn cầm được gì trong tay?",
      helperText: "Điều chỉnh goal",
      aiPurpose: "ADJUST_GOAL",
    },
  ],
}

test("Template guide schema validates custom requirements", () => {
  const parsed = TemplateDraftInputSchema.safeParse({
    ...validTemplate,
    customRequirements: [
      {
        id: "deadline",
        label: "Deadline",
        fieldType: "DATE",
        options: [],
        required: true,
        aiHint: "Điều chỉnh phạm vi steps theo deadline.",
        order: 1,
      },
    ],
  })

  assert.equal(parsed.success, true)
})

test("Template guide schema rejects SELECT custom requirements without 2 options", () => {
  const parsed = TemplateDraftInputSchema.safeParse({
    ...validTemplate,
    customRequirements: [
      {
        id: "tone",
        label: "Tông giọng",
        fieldType: "SELECT",
        options: ["Trang trọng"],
        required: false,
        aiHint: "Điều chỉnh guidance theo tông giọng.",
        order: 1,
      },
    ],
  })

  assert.equal(parsed.success, false)
})

test("calculateRetroMinutes rounds 10-15 percent to five minute blocks", () => {
  assert.equal(calculateRetroMinutes([25, 30, 25]), 10)
  assert.equal(calculateRetroMinutes([60, 60, 60]), 20)
})

test("custom requirements are formatted for template prompt injection", () => {
  const prompt = formatCustomRequirementsForPrompt([
    {
      label: "Ngân sách",
      fieldType: "NUMBER",
      required: true,
      aiHint: "Giữ phạm vi steps trong ngân sách.",
      options: [],
    },
  ])

  assert.match(prompt, /Ngân sách/)
  assert.match(prompt, /use for: Giữ phạm vi steps trong ngân sách/)
})

test("migration adds template guide fields", () => {
  const migration = readFileSync(
    "../api/prisma/migrations/202607110001_add_template_goal_template/migration.sql",
    "utf8"
  )

  assert.match(migration, /customRequirements/)
  assert.match(migration, /aiPurpose/)
  assert.match(migration, /ScaffoldQuestionPurpose/)
})
