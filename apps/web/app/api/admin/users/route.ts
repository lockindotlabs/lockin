import { requireAdminApiAccess } from "@/lib/server/admin-access"
import { clerkClient } from "@clerk/nextjs/server"
import prisma from "@workspace/db"

function getClerkEmail(user: {
  primaryEmailAddressId: string | null
  emailAddresses: Array<{ id: string; emailAddress: string }>
}) {
  return (
    user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null
  )
}

export async function GET() {
  const access = await requireAdminApiAccess()

  if (!access.ok) {
    return access.response
  }

  try {
    const client = await clerkClient()
    const { data: clerkUsers } = await client.users.getUserList({
      limit: 500,
      orderBy: "-created_at",
    })

    const dbUsers = await prisma.$transaction(
      clerkUsers.map((user) => {
        const banned = user.banned ?? false
        const locked = user.locked ?? false
        const clerkRole =
          user.publicMetadata?.role === "admin" ? "admin" : "user"

        return prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: getClerkEmail(user),
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            banned,
            locked,
            isActive: !banned && !locked,
          },
          create: {
            id: user.id,
            email: getClerkEmail(user),
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            role: clerkRole,
            banned,
            locked,
            isActive: !banned && !locked,
          },
        })
      })
    )

    const dbUserById = new Map(dbUsers.map((user) => [user.id, user]))
    const users = clerkUsers.map((clerkUser) => {
      const dbUser = dbUserById.get(clerkUser.id)!

      return {
        ...dbUser,
        email: getClerkEmail(clerkUser),
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        banned: clerkUser.banned ?? false,
        locked: clerkUser.locked ?? false,
        isActive: !(clerkUser.banned ?? false) && !(clerkUser.locked ?? false),
        createdAt: new Date(clerkUser.createdAt).toISOString(),
        updatedAt: new Date(clerkUser.updatedAt).toISOString(),
      }
    })

    return Response.json(users)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
