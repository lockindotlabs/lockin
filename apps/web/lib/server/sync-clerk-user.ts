import { clerkClient } from "@clerk/nextjs/server"
import prisma from "@workspace/db"

function normalizeRole(value: unknown) {
  return value === "admin" ? "admin" : "user"
}

export async function syncClerkUser(userId: string) {
  let email: string | null = null
  let firstName: string | null = null
  let lastName: string | null = null
  let imageUrl: string | null = null
  let role = "user"
  let banned = false
  let locked = false

  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    email = clerkUser.emailAddresses[0]?.emailAddress ?? null
    firstName = clerkUser.firstName ?? null
    lastName = clerkUser.lastName ?? null
    imageUrl = clerkUser.imageUrl ?? null
    role = normalizeRole(clerkUser.publicMetadata?.role)
    banned = clerkUser.banned ?? false
    locked = clerkUser.locked ?? false
  } catch (error) {
    console.error("Error fetching user data from Clerk:", error)
  }

  return prisma.user.upsert({
    where: { id: userId },
    update: {
      email,
      firstName,
      lastName,
      imageUrl,
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
