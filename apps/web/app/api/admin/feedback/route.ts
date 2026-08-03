import { requireAdminApiAccess } from "@/lib/server/admin-access"
import prisma from "@workspace/db"

export async function GET() {
  const access = await requireAdminApiAccess()

  if (!access.ok) {
    return access.response
  }

  try {
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
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

    return Response.json(
      feedback.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Failed to fetch feedback:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
