import { getCurrentDbUser } from "@/lib/server/current-db-user"
import {
  deleteOwnedTemplate,
  getOwnedTemplate,
  updateOwnedTemplate,
} from "@/lib/server/template-authoring-store"
import { TemplateDraftInputSchema } from "@/lib/server/template-schemas"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const template = await getOwnedTemplate(user.id, id)

  if (!template) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({ template })
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const user = await getCurrentDbUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = TemplateDraftInputSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json({ error: parsed.error.message }, { status: 400 })
    }

    const { id } = await context.params
    const result = await updateOwnedTemplate(user.id, id, parsed.data)

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        return Response.json({ error: "Not found" }, { status: 404 })
      }

      return Response.json(
        { error: "Only draft or rejected templates can be edited." },
        { status: 409 }
      )
    }

    return Response.json({ template: result.template })
  } catch (error) {
    console.error("Failed to update template", error)
    return Response.json(
      { error: "Không thể lưu template. Hãy thử restart dev server nếu vừa đổi Prisma schema." },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const result = await deleteOwnedTemplate(user.id, id)

  if ("error" in result) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  if (result.mode === "UNPUBLISHED") {
    return Response.json({ template: result.template, mode: result.mode })
  }

  return new Response(null, { status: 204 })
}
