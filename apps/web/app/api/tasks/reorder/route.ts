import { z } from "zod"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

const ReorderSchema = z.object({
  tasks: z.array(z.object({ id: z.string(), order: z.number().int() })).min(1),
})

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const parsed = ReorderSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { message: parsed.error.message, code: 400 } },
        { status: 400 }
      )
    }

    const ids = parsed.data.tasks.map((t) => t.id)
    const owned = await prisma.task.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    })

    if (owned.length !== ids.length) {
      return Response.json(
        { success: false, error: { message: "One or more tasks not found", code: 403 } },
        { status: 403 }
      )
    }

    await prisma.$transaction(
      parsed.data.tasks.map(({ id, order }) =>
        prisma.task.update({ where: { id }, data: { order } })
      )
    )

    return Response.json({ success: true, message: "Tasks reordered" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
