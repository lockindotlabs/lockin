import { Webhook } from "svix"
import prisma from "@workspace/db"
import { headers } from "next/headers"

type UserDeletedEvent = {
  type: "user.deleted"
  data: { id: string; deleted: boolean }
}

type ClerkEvent = UserDeletedEvent | { type: string; data: unknown }

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured")
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return Response.json({ error: "Missing svix headers" }, { status: 400 })
  }

  // Get the body
  let payload: string
  try {
    payload = await req.text()
  } catch (err) {
    return Response.json({ error: "Failed to read request body" }, { status: 400 })
  }

  const wh = new Webhook(secret)
  let event: ClerkEvent

  try {
    event = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 })
  }

  if (event.type === "user.deleted") {
    const { id } = (event as UserDeletedEvent).data
    try {
      await prisma.user.updateMany({
        where: { id },
        data: { isActive: false },
      })
    } catch (dbErr) {
      console.error("Database error during user deactivation:", dbErr)
      return Response.json({ error: "Database error" }, { status: 500 })
    }
  }

  return Response.json({ received: true })
}
