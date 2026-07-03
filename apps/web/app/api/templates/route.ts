import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { getExe101TemplateDetail } from "@/lib/templates/exe101-detail"
import { EXE101_FALLBACK_TEMPLATES } from "@/lib/templates/exe101-fallback"
import prisma from "@workspace/db"

function withDetail<T extends {
  slug: string
  scaffoldQuestions?: Array<{ id: string; order: number; prompt: string; helperText?: string | null }>
}>(template: T) {
  const detail = getExe101TemplateDetail(template.slug)
  return {
    ...template,
    detail: detail ?? null,
  }
}

export async function GET() {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const templates = await prisma.workflowTemplate.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        description: true,
        outputType: true,
        isAcademic: true,
        supportsGroupMode: true,
        steps: {
          select: {
            id: true,
            order: true,
            title: true,
            estimatedMinutes: true,
          },
          orderBy: { order: "asc" },
        },
        scaffoldQuestions: {
          select: {
            id: true,
            order: true,
            prompt: true,
            helperText: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    })

    if (templates.length > 0) {
      return Response.json({ templates: templates.map(withDetail) })
    }
  } catch {
    // Fall through to static EXE101 templates when the local DB is unavailable.
  }

  return Response.json({
    templates: EXE101_FALLBACK_TEMPLATES.map((template) => ({
      id: template.id,
      slug: template.slug,
      title: template.title,
      category: template.category,
      description: template.description,
      outputType: template.outputType,
      isAcademic: template.isAcademic,
      supportsGroupMode: template.supportsGroupMode,
      steps: template.steps.map((step) => ({
        id: step.id,
        order: step.order,
        title: step.title,
        estimatedMinutes: step.estimatedMinutes,
      })),
      scaffoldQuestions: template.scaffoldQuestions.map((question) => ({
        id: question.id,
        order: question.order,
        prompt: question.prompt,
        helperText: question.helperText,
      })),
    })),
  })
}
