import { AI_CATALOG } from "@/lib/ai/catalog"
import { getEffectiveTier } from "@/lib/billing/catalog"
import { getCurrentDbUser } from "@/lib/server/current-db-user"

export async function GET() {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tier = getEffectiveTier(user.planTier, user.planExpiresAt)
  const config = AI_CATALOG[tier]

  return Response.json({
    tier,
    allowedModels: config.allowedModels,
    allowedCapabilities: config.allowedCapabilities,
  })
}
