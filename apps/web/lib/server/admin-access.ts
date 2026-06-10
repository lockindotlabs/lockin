import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

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

  return {
    userId,
    isAdmin: isAdminUserId(userId),
  }
}

export async function assertAdminPageAccess() {
  const { isAdmin } = await getAdminAccess()

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
