import { getCurrentDbUser } from "@/lib/server/current-db-user"
import {
  getInstallableTemplate,
  incrementInstallCount,
} from "@/lib/server/template-market-store"

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

  if (template.status === "APPROVED") {
    await incrementInstallCount(template.id)
  }

  return Response.json({ template })
}
