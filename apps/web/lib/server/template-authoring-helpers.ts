import type { TemplateStatus } from "./template-schemas"

type FlattenablePlanStep = {
  id: string
  title: string
  description: string | null
  guidance: string | null
  estimatedMinutes: number
  order: number
  parentId: string | null
}

type FlattenedTemplateStep = {
  order: number
  title: string
  guidance: string | null
  estimatedMinutes: number
}

const MAX_TEMPLATE_STEPS = 40

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function createRandomSuffix() {
  return Math.random().toString(36).slice(2, 8)
}

export function slugifyTemplateTitle(title: string) {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized || "template"
}

export function generateUserTemplateSlug(
  title: string,
  randomSuffix = createRandomSuffix()
) {
  const base = slugifyTemplateTitle(title).slice(0, 48).replace(/-+$/g, "")
  return `user-${base || "template"}-${randomSuffix.slice(0, 6)}`
}

export function canTransitionTemplateStatus(
  from: TemplateStatus,
  to: TemplateStatus
) {
  if (from === to) {
    return true
  }

  switch (from) {
    case "DRAFT":
      return to === "PENDING_REVIEW"
    case "PENDING_REVIEW":
      return to === "APPROVED" || to === "REJECTED"
    case "APPROVED":
      return to === "DRAFT"
    case "REJECTED":
      return to === "DRAFT" || to === "PENDING_REVIEW"
    default:
      return false
  }
}

export function flattenPlanStepsForTemplate(
  steps: FlattenablePlanStep[]
): FlattenedTemplateStep[] {
  const stepsByParent = new Map<string | null, FlattenablePlanStep[]>()

  for (const step of [...steps].sort((a, b) => a.order - b.order)) {
    const key = step.parentId ?? null
    const group = stepsByParent.get(key) ?? []
    group.push(step)
    stepsByParent.set(key, group)
  }

  const flattened: FlattenedTemplateStep[] = []

  const visit = (step: FlattenablePlanStep, parentTitle: string | null) => {
    const prefix = parentTitle ? `(Thuoc buoc: ${parentTitle}) ` : ""
    const sourceGuidance = step.guidance ?? step.description ?? null
    const guidance = sourceGuidance
      ? `${prefix}${normalizeWhitespace(sourceGuidance)}`
      : parentTitle
        ? prefix.trimEnd()
        : null

    flattened.push({
      order: flattened.length + 1,
      title: normalizeWhitespace(step.title),
      guidance,
      estimatedMinutes: step.estimatedMinutes,
    })

    const children = stepsByParent.get(step.id) ?? []
    for (const child of children) {
      visit(child, step.title)
    }
  }

  for (const root of stepsByParent.get(null) ?? []) {
    visit(root, null)
  }

  if (flattened.length > MAX_TEMPLATE_STEPS) {
    throw new Error(`Template snapshots support up to ${MAX_TEMPLATE_STEPS} steps.`)
  }

  return flattened
}
