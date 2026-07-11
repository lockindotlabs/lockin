import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { getCurrentAuthorName } from "@/lib/server/current-user-name"
import {
  createTemplate,
  listOwnedTemplates,
} from "@/lib/server/template-authoring-store"
import { TemplateDraftInputSchema } from "@/lib/server/template-schemas"

export async function GET() {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const templates = await listOwnedTemplates(user.id)
  return Response.json({ templates })
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = TemplateDraftInputSchema.safeParse(await req.json())

    if (!parsed.success) {
      return Response.json({ error: parsed.error.message }, { status: 400 })
    }

    const template = await createTemplate(
      user.id,
      await getCurrentAuthorName(),
      parsed.data
    )

    return Response.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Failed to create template", error)
    return Response.json(
      { error: "Không thể lưu template. Hãy thử restart dev server nếu vừa đổi Prisma schema." },
      { status: 500 }
    )
  }
}
