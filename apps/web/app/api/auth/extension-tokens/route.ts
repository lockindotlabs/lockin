import { randomBytes } from "crypto"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const tokens = await prisma.extensionToken.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: "desc" },
    })
    return Response.json({ success: true, data: tokens })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const name = body?.name || "Extension"
    const token = randomBytes(32).toString("hex")

    const record = await prisma.extensionToken.create({
      data: { userId: user.id, token, name },
    })

    return Response.json(
      {
        success: true,
        message: "Token created",
        data: {
          id: record.id,
          name: record.name,
          token,
          createdAt: record.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
