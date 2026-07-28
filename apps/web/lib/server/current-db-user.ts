import { auth } from "@clerk/nextjs/server"
import { syncClerkUser } from "@/lib/server/sync-clerk-user"

export async function getCurrentDbUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  return syncClerkUser(userId)
}
