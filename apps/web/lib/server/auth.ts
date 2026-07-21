import { auth } from "@clerk/nextjs/server"
import prisma from "@workspace/db"

/**
 * Get the currently authenticated user for API route handlers.
 * Supports both standard Clerk auth sessions (via cookies/headers) and
 * Chrome Extension long-lived token authentication (via Authorization: Bearer <token>).
 */
async function syncClerkUser(userId: string) {
  let email: string | null = null
  let firstName: string | null = null
  let lastName: string | null = null
  let imageUrl: string | null = null
  let role = "user"
  let banned = false
  let locked = false

  try {
    const { clerkClient } = await import("@clerk/nextjs/server")
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    email = clerkUser.emailAddresses[0]?.emailAddress ?? null
    firstName = clerkUser.firstName ?? null
    lastName = clerkUser.lastName ?? null
    imageUrl = clerkUser.imageUrl ?? null
    role = (clerkUser.publicMetadata?.role as string) ?? "user"
    banned = clerkUser.banned ?? false
    locked = clerkUser.locked ?? false
  } catch (error) {
    console.error("Error fetching user data from Clerk in auth:", error)
  }

  return prisma.user.upsert({
    where: { id: userId },
    update: {
      email,
      firstName,
      lastName,
      imageUrl,
      role,
      banned,
      locked,
      isActive: !banned && !locked,
    },
    create: {
      id: userId,
      email,
      firstName,
      lastName,
      imageUrl,
      role,
      banned,
      locked,
      isActive: !banned && !locked,
    },
  })
}

/**
 * Get the currently authenticated user for API route handlers.
 * Supports both standard Clerk auth sessions (via cookies/headers) and
 * Chrome Extension long-lived token authentication (via Authorization: Bearer <token>).
 */
export async function getAuthenticatedUser(req: Request) {
  // 1. Try Clerk auth context first (standard web requests)
  const { userId } = await auth()
  if (userId) {
    return syncClerkUser(userId)
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
