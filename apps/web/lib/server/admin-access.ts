import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import prisma from "@workspace/db"

export async function getAdminAccess() {
  const { userId } = await auth()

  if (!userId) {
    return {
      userId: null,
      isAdmin: false,
    }
  }

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
    return redirectToSignIn()
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (dbUser?.role !== "admin") {
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
