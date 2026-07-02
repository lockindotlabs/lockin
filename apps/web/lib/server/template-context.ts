import prisma from "@workspace/db"

export async function resolveTemplateContext(templateId: string | null | undefined) {
  if (!templateId) return undefined

  const template = await prisma.workflowTemplate.findUnique({
    where: { id: templateId },
    include: {
      steps: { orderBy: { order: "asc" } },
      scaffoldQuestions: { orderBy: { order: "asc" } },
    },
  })

  if (!template) return undefined

  const stepLines = template.steps
    .map((s) => {
      const guidance = s.guidance ? `\n   Guidance: ${s.guidance}` : ""
      return `${s.order}. ${s.title} (~${s.estimatedMinutes} min)${guidance}`
    })
    .join("\n")

  const scaffoldLines = template.scaffoldQuestions
    .map((q) => `- ${q.prompt}${q.helperText ? ` (${q.helperText})` : ""}`)
    .join("\n")

  const lines = [
    `Template: ${template.title}`,
    template.description ? `Description: ${template.description}` : null,
    `Category: ${template.category}`,
    `Output type: ${template.outputType}`,
    template.domainTags.length > 0 ? `Domain tags: ${template.domainTags.join(", ")}` : null,
    stepLines ? `\nBlueprint steps (follow this structure exactly):\n${stepLines}` : null,
    scaffoldLines
      ? `\nScaffold questions (ask user these before generating):\n${scaffoldLines}`
      : null,
  ]
    .filter(Boolean)
    .join("\n")

  return `The user selected a workflow template. Ground your plan on this blueprint — do not invent a different structure.\n\n${lines}`
}
