import { requireAdminApiAccess } from "@/lib/server/admin-access"
import prisma from "@workspace/db"

const STATUSES = new Set(["OPEN", "REVIEWED", "ARCHIVED"])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdminApiAccess()

  if (!access.ok) {
    return access.response
  }

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const status =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).status
      : undefined

  if (typeof status !== "string" || !STATUSES.has(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 })
  }

  const { id } = await params

  try {
    const feedback = await prisma.feedback.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            role: true,
          },
        },
      },
    })

    return Response.json({
      ...feedback,
      createdAt: feedback.createdAt.toISOString(),
      updatedAt: feedback.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Failed to update feedback:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
