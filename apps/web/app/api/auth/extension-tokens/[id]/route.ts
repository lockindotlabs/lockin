import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const existing = await prisma.extensionToken.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return Response.json(
        { success: false, error: { message: "Token not found", code: 404 } },
        { status: 404 }
      )
    }

    await prisma.extensionToken.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
