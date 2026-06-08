import { getBillingState } from "@/lib/billing/orders"
import { getCurrentDbUser } from "@/lib/server/current-db-user"

export async function GET() {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return Response.json(await getBillingState(user.id))
}
