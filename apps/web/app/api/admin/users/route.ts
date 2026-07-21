import { requireAdminApiAccess } from "@/lib/server/admin-access"
import prisma from "@workspace/db"

export async function GET() {
  const access = await requireAdminApiAccess()

  if (!access.ok) {
    return access.response
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    })

    return Response.json(users)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
