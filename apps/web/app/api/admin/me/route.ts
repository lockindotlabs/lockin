import { getAdminAccess } from "@/lib/server/admin-access"

export async function GET() {
  const access = await getAdminAccess()

  if (!access.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return Response.json({
    isAdmin: access.isAdmin,
  })
}
