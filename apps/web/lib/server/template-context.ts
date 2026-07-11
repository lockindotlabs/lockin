import prisma from "@workspace/db"
import type { Prisma } from "@workspace/db"
import { getExe101FallbackTemplate } from "@/lib/templates/exe101-fallback"

type TemplateInstructionPack = {
  thinkingFocus: string[]
  executionRules: string[]
  reviewChecks: string[]
  requiredDeliverables: string[]
  strictRequirements: string[]
}

const TEMPLATE_INSTRUCTIONS: Record<string, TemplateInstructionPack> = {
  "exe101-cp1-one-idea-team-structure": {
    thinkingFocus: [
      "Force the user to compare multiple startup ideas before locking one in.",
      "Ground the plan in problem-first reasoning: who has the pain point, why it matters, and why now.",
      "Make the team articulate why the chosen idea beats the rejected ones.",
    ],
    executionRules: [
      "Structure the work into three explicit phases: Thinking -> Execution -> Review.",
      "Include the CP1 content blocks from the notice: company overview, project team, problem, target customer, solution, USP, revenue model, technology/innovation, trend, legal basics, scale-up potential.",
      "If the task is group-based, include an early step for role assignment and slide ownership.",
    ],
    reviewChecks: [
      "Review against the CP1 rubric categories: content, slide design, delivery, teamwork, Q&A, improvement effort, and on-time submission.",
      "Ensure the final review checks whether the argument for the single chosen idea is strong enough for in-class challenge.",
    ],
    requiredDeliverables: [
      "Idea evaluation file",
      "CP1 slide deck in English",
      "Oral presentation-ready talking flow",
    ],
    strictRequirements: [
      "Do not generate a generic startup plan that skips the self-assessment comparison.",
      "Do not jump directly to making slides before the chosen idea is justified.",
    ],
  },
  "exe101-cp2-market-analysis-research-survey": {
    thinkingFocus: [
      "Define what the team is trying to prove about the startup idea before collecting data.",
      "Tie every research activity back to a market-validation question.",
      "Keep the user focused on evidence, not opinion.",
    ],
    executionRules: [
      "Structure the work into three explicit phases: Thinking -> Execution -> Review.",
      "Include the notice-required artifacts: market overview, survey, expert interviews, competitor analysis, PESTEL, SWOT, STP, and next steps.",
      "Keep survey work and expert interview work as separate concrete steps.",
      "Turn raw data into charts and insights before the final slide-writing step.",
    ],
    reviewChecks: [
      "Verify the plan accounts for at least 100 survey respondents.",
      "Verify the plan accounts for at least 2 expert interviews.",
      "Verify the review phase checks that the ZIP package includes slides, Excel survey file, and interview evidence.",
    ],
    requiredDeliverables: [
      "PDF slide deck",
      "Excel file with survey questions and responses",
      "Expert interview evidence file",
    ],
    strictRequirements: [
      "Do not skip PESTEL, SWOT, or STP.",
      "Do not let next steps become generic; they must follow from the research findings.",
    ],
  },
  "exe101-cp3-demo-bmc-marketing-operation": {
    thinkingFocus: [
      "Translate CP2 insight into product logic before building artifacts.",
      "Clarify what user flow best demonstrates the value proposition.",
      "Keep business logic consistent across demo, BMC, and go-to-market plan.",
    ],
    executionRules: [
      "Structure the work into three explicit phases: Thinking -> Execution -> Review.",
      "Cover all required parts: Figma demo, BMC, 7P marketing plan, operation plan, risk management, and long-term strategy.",
      "Do not collapse Figma into a vague 'design app' step; focus on key screens and user flow.",
      "Include both customer-facing execution (marketing) and internal execution (operations).",
    ],
    reviewChecks: [
      "Check consistency between CP2 research, the BMC, and the Figma demo.",
      "Check whether the long-term strategy matches the chosen positioning and operations capacity.",
    ],
    requiredDeliverables: [
      "Slides",
      "Figma link",
      "Presentation-ready demo flow",
    ],
    strictRequirements: [
      "Do not treat BMC or 7P as optional.",
      "Do not produce a plan that is only about slide-making; it must include business design work first.",
    ],
  },
  "exe101-cp4-financial-forecast-pitch-deck": {
    thinkingFocus: [
      "Make the user define revenue logic and assumptions before building the spreadsheet.",
      "Keep attention on financial viability, not only on making a pretty pitch deck.",
      "Force the plan to connect business model assumptions to projected numbers.",
    ],
    executionRules: [
      "Structure the work into three explicit phases: Thinking -> Execution -> Review.",
      "Cover revenue forecast, expense forecast, projected income statement, funding strategy, and pitch deck.",
      "Model the Excel work before the slide work, because the pitch deck depends on the forecast logic.",
      "Include a step for validating formulas and assumption consistency.",
    ],
    reviewChecks: [
      "Check that monthly first-year and broader later-stage forecasts are both addressed.",
      "Check that the funding strategy includes timing, valuation, amount, equity, and use of funds.",
      "Check that the final pitch deck is anchored in the same numbers as the spreadsheet.",
    ],
    requiredDeliverables: [
      "Excel financial forecast",
      "Pitch deck PDF",
      "Funding narrative with valuation benchmark",
    ],
    strictRequirements: [
      "Do not skip assumptions behind revenue calculations.",
      "Do not generate a plan that starts with slides before the financial model exists.",
    ],
  },
}

function renderList(title: string, items: string[]) {
  if (items.length === 0) return null
  return `${title}:\n${items.map((item) => `- ${item}`).join("\n")}`
}

type PromptCustomRequirement = {
  label: string
  fieldType: string
  required: boolean
  aiHint: string
  options: string[]
}

function parseCustomRequirements(
  value: Prisma.JsonValue | null | undefined
): PromptCustomRequirement[] {
  if (!Array.isArray(value)) return []

  return value
    .map<PromptCustomRequirement | null>((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null
      }

      const record = item as Record<string, unknown>
      const label = typeof record.label === "string" ? record.label.trim() : ""
      const aiHint = typeof record.aiHint === "string" ? record.aiHint.trim() : ""
      const fieldType =
        typeof record.fieldType === "string" ? record.fieldType : "TEXT"
      const required =
        typeof record.required === "boolean" ? record.required : false
      const options = Array.isArray(record.options)
        ? record.options.filter((option): option is string => typeof option === "string")
        : []

      if (!label || !aiHint) return null

      return { label, fieldType, required, aiHint, options }
    })
    .filter((item): item is PromptCustomRequirement => item !== null)
}

export function formatCustomRequirementsForPrompt(
  value: Prisma.JsonValue | null | undefined
) {
  return parseCustomRequirements(value)
    .map((requirement) => {
      const options =
        requirement.fieldType === "SELECT" && requirement.options.length
          ? `; options: ${requirement.options.join(", ")}`
          : ""
      return `- ${requirement.label} (${requirement.fieldType}${requirement.required ? ", required" : ""}${options}) -> use for: ${requirement.aiHint}`
    })
    .join("\n")
}

export async function resolveTemplateContext(
  templateId: string | null | undefined,
  userId?: string | null
) {
  if (!templateId) return undefined
  const visibilityFilter = userId
    ? { OR: [{ status: "APPROVED" as const }, { authorId: userId }] }
    : { status: "APPROVED" as const }

  let template:
    | {
        id: string
        slug: string
        title: string
        description: string | null
        goalTemplate: string | null
        customRequirements: Prisma.JsonValue
        category: string
        outputType: string
        domainTags: string[]
        steps: { order: number; title: string; estimatedMinutes: number; guidance: string | null }[]
        scaffoldQuestions: { order: number; prompt: string; helperText: string | null; aiPurpose?: string }[]
      }
    | null = null

  try {
    template = await prisma.workflowTemplate.findFirst({
      where: {
        AND: [
          { OR: [{ id: templateId }, { slug: templateId }] },
          visibilityFilter,
        ],
      },
      include: {
        steps: { orderBy: { order: "asc" } },
        scaffoldQuestions: { orderBy: { order: "asc" } },
      },
    })
  } catch {
    template = null
  }

  if (!template) {
    const fallback = getExe101FallbackTemplate(templateId)
    if (fallback) {
      template = {
        id: fallback.id,
        slug: fallback.slug,
        title: fallback.title,
        description: fallback.description,
        goalTemplate: null,
        customRequirements: [],
        category: fallback.category,
        outputType: fallback.outputType,
        domainTags: fallback.domainTags,
        steps: fallback.steps.map((step) => ({
          order: step.order,
          title: step.title,
          estimatedMinutes: step.estimatedMinutes,
          guidance: step.guidance ?? null,
        })),
        scaffoldQuestions: fallback.scaffoldQuestions.map((question) => ({
          order: question.order,
          prompt: question.prompt,
          helperText: question.helperText ?? null,
          aiPurpose: "GENERATE_STEPS",
        })),
      }
    }
  }

  if (!template) return undefined

  const stepLines = template.steps
    .map((step) => {
      const guidance = step.guidance ? `\n   Guidance: ${step.guidance}` : ""
      return `${step.order}. ${step.title} (~${step.estimatedMinutes} min)${guidance}`
    })
    .join("\n")

  const scaffoldLines = template.scaffoldQuestions
    .map(
      (question) =>
        `- ${question.prompt} (AI purpose: ${question.aiPurpose ?? "GENERATE_STEPS"}${question.helperText ? `; helper: ${question.helperText}` : ""})`
    )
    .join("\n")

  const customRequirementLines = formatCustomRequirementsForPrompt(
    template.customRequirements
  )

  const instructionPack = TEMPLATE_INSTRUCTIONS[template.slug]
  const instructionSections = instructionPack
    ? [
        renderList("Thinking focus", instructionPack.thinkingFocus),
        renderList("Execution rules", instructionPack.executionRules),
        renderList("Review checks", instructionPack.reviewChecks),
        renderList("Required deliverables", instructionPack.requiredDeliverables),
        renderList("Strict requirements", instructionPack.strictRequirements),
      ]
        .filter(Boolean)
        .join("\n\n")
    : null

  const lines = [
    "The user selected a workflow template. Ground your plan on this blueprint and keep the structure faithful.",
    "Whenever you draft the plan, explicitly preserve three phases in order: Thinking, Execution, Review.",
    `Template: ${template.title}`,
    template.description ? `Description: ${template.description}` : null,
    template.goalTemplate
      ? `Sprint goal template: ${template.goalTemplate}`
      : null,
    `Category: ${template.category}`,
    `Output type: ${template.outputType}`,
    template.domainTags.length > 0
      ? `Domain tags: ${template.domainTags.join(", ")}`
      : null,
    stepLines
      ? `\nBlueprint steps (follow this structure closely):\n${stepLines}`
      : null,
    scaffoldLines
      ? `\nScaffold questions (ask these before generating the final plan):\n${scaffoldLines}`
      : null,
    customRequirementLines
      ? `\nCustom requirements (ask after scaffold questions; inject each answer into the prompt as "- label: answer (use for: aiHint)"):\n${customRequirementLines}`
      : null,
    "\nAlways append a locked final step named Review & Retro. Guidance: So kết quả với Sprint Goal. Ghi 1 điều giữ lại và 1 điều sẽ đổi ở sprint sau.",
    instructionSections ? `\nTemplate-specific planning rules:\n${instructionSections}` : null,
    "\nDo not fall back to a generic outline if this template already provides a stronger notice-based structure.",
  ]
    .filter(Boolean)
    .join("\n")

  return lines
}
