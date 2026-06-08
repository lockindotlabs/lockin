import { auth } from "@clerk/nextjs/server"
import prisma from "@workspace/db"

export async function getCurrentDbUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  })
}
