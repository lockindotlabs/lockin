import { getAuthenticatedUser } from "@/lib/server/auth"

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  return Response.json(user)
}
