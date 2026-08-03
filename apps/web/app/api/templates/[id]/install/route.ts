import { getCurrentDbUser } from "@/lib/server/current-db-user"
import {
  getInstallableTemplate,
  incrementInstallCount,
  getTemplateAccessForUser,
} from "@/lib/server/template-market-store"
import { getEffectiveTier } from "@/lib/billing/catalog"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const template = await getInstallableTemplate(user.id, id)

  if (!template) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const tier = getEffectiveTier(user.planTier, user.planExpiresAt)
  const access = await getTemplateAccessForUser({
    userId: user.id,
    templateId: template.id,
    tier,
  })

  if (!access || access.locked) {
    return Response.json(
      {
        code: "TEMPLATE_REQUIRES_UPGRADE",
        requiredTier: access?.requiredTier ?? "PLUS",
        upgradeUrl: "/app/billing",
        message: access?.lockReason ?? "This template requires a higher tier plan.",
      },
      { status: 403 }
    )
  }

  if (template.status === "APPROVED") {
    await incrementInstallCount(template.id)
  }

  return Response.json({ template })
}
