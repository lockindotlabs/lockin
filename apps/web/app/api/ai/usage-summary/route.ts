import { getCurrentDbUser } from "@/lib/server/current-db-user"
import prisma from "@workspace/db"
import { getAiUsageSummary } from "@/lib/ai/enforcement"

export async function GET() {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const summary = await getAiUsageSummary({ prisma, user })
  return Response.json(summary)
}
