import { auth } from "@clerk/nextjs/server"
import prisma from "@workspace/db"

/**
 * Get the currently authenticated user for API route handlers.
 * Supports both standard Clerk auth sessions (via cookies/headers) and
 * Chrome Extension long-lived token authentication (via Authorization: Bearer <token>).
 */
export async function getAuthenticatedUser(req: Request) {
  // 1. Try Clerk auth context first (standard web requests)
  const { userId } = await auth()
  if (userId) {
    return prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    })
  }

  // 2. Fall back to extension token (long-lived bearer token)
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice(7)
    if (!raw.startsWith("eyJ")) {
      const record = await prisma.extensionToken.findUnique({
        where: { token: raw },
      })
      if (record) {
        // Touch lastUsedAt asynchronously (fire-and-forget)
        prisma.extensionToken
          .update({
            where: { id: record.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {})

        return prisma.user.findUnique({
          where: { id: record.userId },
        })
      }
    }
  }

  return null
}
