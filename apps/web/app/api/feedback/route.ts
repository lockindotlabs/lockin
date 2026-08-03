import { getAuthenticatedUser } from "@/lib/server/auth"
import prisma from "@workspace/db"

const MAX_MESSAGE_LENGTH = 4000

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req)

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const payload = body && typeof body === "object" ? body : {}
  const message = readString((payload as Record<string, unknown>).message)
  const path = readString((payload as Record<string, unknown>).path)

  if (message.length < 3) {
    return Response.json(
      { error: "Feedback must be at least 3 characters." },
      { status: 400 }
    )
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Feedback must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
      { status: 400 }
    )
  }

  try {
    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        message,
        path: path || null,
        userAgent: req.headers.get("user-agent"),
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    return Response.json(feedback, { status: 201 })
  } catch (error) {
    console.error("Failed to save feedback:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
