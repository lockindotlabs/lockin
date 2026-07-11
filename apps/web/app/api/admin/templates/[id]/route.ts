import { requireAdminApiAccess } from "@/lib/server/admin-access"
import {
  approveTemplate,
  rejectTemplate,
} from "@/lib/server/template-review-store"
import { TemplateReviewActionSchema } from "@/lib/server/template-schemas"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, context: RouteContext) {
  const access = await requireAdminApiAccess()

  if (!access.ok) {
    return access.response
  }

  const parsed = TemplateReviewActionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  const { id } = await context.params
  const template =
    parsed.data.action === "APPROVE"
      ? await approveTemplate(id)
      : await rejectTemplate(id, parsed.data.reason)

  if (!template) {
    return Response.json(
      { error: "Template is no longer pending review." },
      { status: 409 }
    )
  }

  return Response.json({ template })
}
