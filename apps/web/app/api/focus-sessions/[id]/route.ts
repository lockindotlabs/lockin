import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const session = await prisma.focusSession.findFirst({
      where: { id, userId: user.id },
      include: { plan: { select: { id: true, name: true } } },
    })

    if (!session) {
      return Response.json(
        { success: false, error: { message: "Session not found", code: 404 } },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: session })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
