import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import prisma from "@workspace/db"

const ADMIN_USER_IDS_ENV = "user_3Dkrex6deNDuV9ykg4bQCy2rqJC"

function getAdminUserIds() {
  return ADMIN_USER_IDS_ENV.split(",")
    .map((id) => id.trim())
    .filter((id) => id)
}

export function isAdminUserId(userId: string | null | undefined) {
  if (!userId) {
    return false
  }

  return getAdminUserIds().includes(userId)
}

export async function getAdminAccess() {
  const { userId } = await auth()

  if (!userId) {
    return {
      userId: null,
      isAdmin: false,
    }
  }

  // 1. Check hardcoded fallback first
  if (isAdminUserId(userId)) {
    return {
      userId,
      isAdmin: true,
    }
  }

  // 2. Check the user's role in the database
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return {
    userId,
    isAdmin: dbUser?.role === "admin",
  }
}

export async function assertAdminPageAccess() {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    redirectToSignIn()
  }

  const isAdmin = isAdminUserId(userId)

  if (!isAdmin) {
    redirect("/app")
  }
}

export async function requireAdminApiAccess() {
  const { userId, isAdmin } = await getAdminAccess()

  if (!userId) {
    return {
      ok: false as const,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (!isAdmin) {
    return {
      ok: false as const,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return {
    ok: true as const,
    userId,
  }
}
