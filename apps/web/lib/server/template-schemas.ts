import { z } from "zod"

export const TEMPLATE_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
] as const

export const WORKFLOW_OUTPUT_TYPES = [
  "DOCUMENT",
  "SKILL_PRACTICE",
  "PROJECT",
] as const

export const SCAFFOLD_QUESTION_PURPOSES = [
  "ADJUST_GOAL",
  "GENERATE_STEPS",
  "ESTIMATE_TIMEBOX",
  "IDENTIFY_OBSTACLE",
] as const

export const CUSTOM_REQUIREMENT_FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "SELECT",
  "DATE",
] as const

export const TemplateStepInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  guidance: z.string().trim().max(2000).nullable(),
  estimatedMinutes: z.number().int().min(5).max(120),
})

export const ScaffoldQuestionInputSchema = z.object({
  prompt: z.string().trim().min(1).max(200),
  helperText: z.string().trim().max(500).nullable(),
  aiPurpose: z.enum(SCAFFOLD_QUESTION_PURPOSES).optional().default("GENERATE_STEPS"),
})

export const CustomRequirementInputSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(120),
    fieldType: z.enum(CUSTOM_REQUIREMENT_FIELD_TYPES).default("TEXT"),
    options: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
    required: z.boolean().default(false),
    aiHint: z.string().trim().min(1).max(500),
    order: z.number().int().min(1).max(10),
  })
  .superRefine((requirement, ctx) => {
    if (requirement.fieldType === "SELECT" && requirement.options.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "SELECT requirements need at least 2 options.",
        path: ["options"],
      })
    }
  })

export const TemplateDraftInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(2000),
  goalTemplate: z.string().trim().min(1).max(200),
  isAcademic: z.boolean().optional().default(false),
  domainTags: z.array(z.string().trim().min(1).max(40)).max(10),
  outputType: z.enum(WORKFLOW_OUTPUT_TYPES),
  supportsGroupMode: z.boolean().optional().default(false),
  priceVnd: z.number().int().min(0).nullable().optional(),
  steps: z.array(TemplateStepInputSchema).min(1).max(40),
  scaffoldQuestions: z.array(ScaffoldQuestionInputSchema).max(10),
  customRequirements: z.array(CustomRequirementInputSchema).max(10).default([]),
})

export const TemplateReviewActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("APPROVE"),
  }),
  z.object({
    action: z.literal("REJECT"),
    reason: z.string().trim().min(1).max(1000),
  }),
])

export const TemplateListFilterSchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  search: z.string().trim().min(1).max(120).optional(),
})

export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number]
export type WorkflowOutputType = (typeof WORKFLOW_OUTPUT_TYPES)[number]
export type ScaffoldQuestionPurpose = (typeof SCAFFOLD_QUESTION_PURPOSES)[number]
export type CustomRequirementFieldType = (typeof CUSTOM_REQUIREMENT_FIELD_TYPES)[number]
export type TemplateStepInput = z.infer<typeof TemplateStepInputSchema>
export type ScaffoldQuestionInput = z.infer<typeof ScaffoldQuestionInputSchema>
export type CustomRequirementInput = z.infer<typeof CustomRequirementInputSchema>
export type TemplateDraftInput = z.infer<typeof TemplateDraftInputSchema>
export type TemplateReviewAction = z.infer<typeof TemplateReviewActionSchema>
