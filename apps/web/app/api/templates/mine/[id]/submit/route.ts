import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { getCurrentAuthorName } from "@/lib/server/current-user-name"
import { submitTemplateForReview } from "@/lib/server/template-authoring-store"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const result = await submitTemplateForReview(
    user.id,
    id,
    await getCurrentAuthorName()
  )

  if ("error" in result) {
    if (result.error === "NOT_FOUND") {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    if (result.error === "INVALID") {
      return Response.json(
        { error: "Templates need at least one step before review." },
        { status: 400 }
      )
    }

    return Response.json(
      { error: "Only drafts can be submitted for review." },
      { status: 409 }
    )
  }

  return Response.json({ template: result.template })
}
