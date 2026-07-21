import { requireAdminApiAccess } from "@/lib/server/admin-access"
import { clerkClient } from "@clerk/nextjs/server"
import prisma from "@workspace/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdminApiAccess()

  if (!access.ok) {
    return access.response
  }

  const { id: targetUserId } = await params

  // Prevent an admin from self-banning, self-locking, or self-demoting
  if (targetUserId === access.userId) {
    return Response.json(
      { error: "You cannot modify your own admin role or account state." },
      { status: 400 }
    )
  }

  let body: {
    role?: string
    banned?: boolean
    locked?: boolean
  }

  try {
    body = await req.json()
  } catch (err) {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { role, banned, locked } = body

  try {
    const client = await clerkClient()

    // 1. Handle Role Update
    if (role !== undefined) {
      if (role !== "admin" && role !== "user") {
        return Response.json({ error: "Invalid role value" }, { status: 400 })
      }
      await client.users.updateUserMetadata(targetUserId, {
        publicMetadata: {
          role,
        },
      })
    }

    // 2. Handle Ban/Unban State
    if (banned !== undefined) {
      if (banned) {
        await client.users.banUser(targetUserId)
      } else {
        await client.users.unbanUser(targetUserId)
      }
    }

    // 3. Handle Lock/Unlock State
    if (locked !== undefined) {
      if (locked) {
        await client.users.lockUser(targetUserId)
      } else {
        await client.users.unlockUser(targetUserId)
      }
    }

    // Sync the updated state to the local database
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(role !== undefined && { role }),
        ...(banned !== undefined && { banned }),
        ...(locked !== undefined && { locked }),
        isActive:
          banned !== undefined || locked !== undefined
            ? !(banned ?? false) && !(locked ?? false)
            : undefined,
      },
    })

    return Response.json(updatedUser)
  } catch (error: any) {
    console.error("Clerk Backend API error:", error)

    // Handle Clerk API maintenance mode error specifically
    if (
      error &&
      (error.code === "maintenance_mode" ||
        error.status === 503 ||
        (error.message && error.message.includes("maintenance")))
    ) {
      return Response.json(
        {
          error:
            "Clerk service is currently under maintenance. State modifications are temporarily restricted.",
        },
        { status: 503 }
      )
    }

    const message = error?.message || "Failed to update user state"
    return Response.json({ error: message }, { status: error?.status || 500 })
  }
}
