import { z } from "zod"

import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { getCurrentAuthorName } from "@/lib/server/current-user-name"
import { snapshotPlanAsTemplate } from "@/lib/server/template-authoring-store"

const SnapshotFromPlanSchema = z.object({
  planId: z.string().min(1),
})

export async function POST(req: Request) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = SnapshotFromPlanSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  try {
    const result = await snapshotPlanAsTemplate(
      user.id,
      parsed.data.planId,
      await getCurrentAuthorName()
    )

    if ("error" in result) {
      return Response.json({ error: "Plan not found" }, { status: 404 })
    }

    return Response.json({ template: result.template }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    throw error
  }
}
