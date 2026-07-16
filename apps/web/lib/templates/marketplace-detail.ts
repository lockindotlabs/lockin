export type MarketplaceTemplateStep = {
  id: string
  order: number
  title: string
  estimatedMinutes: number
  guidance?: string | null
}

export type MarketplaceScaffoldQuestion = {
  id: string
  order: number
  prompt: string
  helperText?: string | null
}

export type MarketplaceScaffoldField = {
  id: string
  label: string
  placeholder: string
  helperText?: string
}

export type MarketplaceTemplateDetail = {
  overview: string
  whatThisTemplateDoes: string[]
  sprintableWork: string[]
  longRunningWork: string[]
  deliverables: string[]
  saveReadinessChecks: string[]
  scaffoldFields: MarketplaceScaffoldField[]
}

export type PromptTemplate = {
  title: string
  description: string | null
  steps: MarketplaceTemplateStep[]
  scaffoldQuestions: MarketplaceScaffoldQuestion[]
  detail: MarketplaceTemplateDetail | null
}

export function buildMarketplaceTemplateDetail(
  template: PromptTemplate
): MarketplaceTemplateDetail {
  if (template.detail) {
    return template.detail
  }

  return {
    overview: template.description ?? "",
    whatThisTemplateDoes: [],
    sprintableWork: [],
    longRunningWork: [],
    deliverables: [],
    saveReadinessChecks: [],
    scaffoldFields: template.scaffoldQuestions.map((question) => ({
      id: question.id,
      label: question.prompt,
      placeholder: question.helperText ?? "",
      helperText: question.helperText ?? undefined,
    })),
  }
}

export function buildTemplatePrompt(
  template: PromptTemplate,
  answers: Record<string, string>,
  locale = "vi"
) {
  const detail = buildMarketplaceTemplateDetail(template)
  const isVietnamese = locale.toLowerCase().startsWith("vi")
  const scaffoldEntries = Object.entries(answers)
    .map(([id, value]) => {
      const field = detail.scaffoldFields.find((item) => item.id === id) ?? null
      if (!value.trim() || !field) return null
      return `- ${field.label}: ${value.trim()}`
    })
    .filter(Boolean)
    .join("\n")

  const workflowSteps = template.steps
    .map((step) => {
      const guidance = step.guidance?.trim()
      return guidance
        ? `${step.order}. ${step.title}\n   ${
            isVietnamese ? "Hướng dẫn" : "Guidance"
          }: ${guidance}`
        : `${step.order}. ${step.title}`
    })
    .join("\n")

  const sprintable = detail.sprintableWork.map((item) => `- ${item}`).join("\n")
  const longRunning = detail.longRunningWork
    .map((item) => `- ${item}`)
    .join("\n")

  const promptParts = isVietnamese
    ? [
        `Tôi muốn lập kế hoạch theo template "${template.title}".`,
        template.description
          ? `Ngữ cảnh template: ${template.description}`
          : null,
        "Hãy lập kế hoạch đúng theo workflow của template này.",
        "Phân tách rõ các bước Thinking - Execution - Review.",
        "Nếu có việc không thể hoàn thành trong 1 sprint, hãy đánh dấu đó là việc cần theo dõi dài hơn 1 sprint.",
        workflowSteps
          ? `Cấu trúc workflow tham khảo từ template:\n${workflowSteps}`
          : null,
        sprintable ? `Những việc có thể đưa vào sprint:\n${sprintable}` : null,
        longRunning
          ? `Những việc cần thời gian dài hơn 1 sprint:\n${longRunning}`
          : null,
        scaffoldEntries
          ? `Đây là câu trả lời scaffold của tôi:\n${scaffoldEntries}`
          : null,
        "Chỉ khi kế hoạch đã đủ ngữ cảnh, đủ các phase, và đủ hướng dẫn thì mới đề xuất lưu kế hoạch.",
      ]
    : [
        `I want to build a plan from the "${template.title}" template.`,
        template.description
          ? `Template context: ${template.description}`
          : null,
        "Build the plan using this template workflow.",
        "Clearly separate the Thinking - Execution - Review phases.",
        "If something cannot be completed in one sprint, mark it as work that needs tracking beyond one sprint.",
        workflowSteps
          ? `Reference workflow from the template:\n${workflowSteps}`
          : null,
        sprintable ? `Work that can fit into a sprint:\n${sprintable}` : null,
        longRunning
          ? `Work that needs more than one sprint:\n${longRunning}`
          : null,
        scaffoldEntries ? `My scaffold answers:\n${scaffoldEntries}` : null,
        "Only suggest saving the plan once it has enough context, all phases, and enough guidance.",
      ]

  return promptParts.filter(Boolean).join("\n\n")
}
