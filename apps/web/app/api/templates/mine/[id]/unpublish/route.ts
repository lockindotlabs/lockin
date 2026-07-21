import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { unpublishTemplate } from "@/lib/server/template-authoring-store"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const result = await unpublishTemplate(user.id, id)

  if ("error" in result) {
    if (result.error === "NOT_FOUND") {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    return Response.json(
      { error: "Only approved templates can be unpublished." },
      { status: 409 }
    )
  }

  return Response.json({ template: result.template })
}
