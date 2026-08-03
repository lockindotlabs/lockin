import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { listMarketTemplates } from "@/lib/server/template-market-store"
import { getEffectiveTier } from "@/lib/billing/catalog"
import { getTemplateAccessState } from "@/lib/billing/entitlements"
import { getExe101TemplateDetail } from "@/lib/templates/exe101-detail"
import { EXE101_FALLBACK_TEMPLATES } from "@/lib/templates/exe101-fallback"

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

export async function GET(req: Request) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const templates = await listMarketTemplates({
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      userId: user.id,
    })

    const tier = getEffectiveTier(user.planTier, user.planExpiresAt)
    const approvedTemplates = await listMarketTemplates({})
    const approvedIndex = new Map(
      approvedTemplates.map((template, index) => [template.id, index])
    )

    return Response.json({
      templates: templates.map((template) => {
        const isOwned = template.authorId === user.id
        const access = getTemplateAccessState({
          tier,
          marketplaceIndex: approvedIndex.get(template.id) ?? 0,
          isOwned,
        })

        return withDetail({ ...template, isOwned, ...access })
      }),
    })
  } catch {
    // Fall through to static EXE101 templates when the local DB is unavailable.
  }

  const tier = getEffectiveTier(user.planTier, user.planExpiresAt)
  return Response.json({
    templates: EXE101_FALLBACK_TEMPLATES.map((template, marketplaceIndex) => ({
      id: template.id,
      slug: template.slug,
      title: template.title,
      category: template.category,
      description: template.description,
      outputType: template.outputType,
      isAcademic: template.isAcademic,
      supportsGroupMode: template.supportsGroupMode,
      authorName: null,
      status: "APPROVED",
      isOwned: false,
      ...getTemplateAccessState({ tier, marketplaceIndex }),
      installCount: 0,
      steps: template.steps.map((step) => ({
        id: step.id,
        order: step.order,
        title: step.title,
        guidance: step.guidance,
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
