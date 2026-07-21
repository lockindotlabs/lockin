import { getAuthenticatedUser } from "@/lib/server/auth"
import { getMeStats } from "@/lib/server/me-stats"

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const data = await getMeStats(user.id)
  return Response.json({ success: true, data })
}
