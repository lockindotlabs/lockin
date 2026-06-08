import { z } from "zod"

import { syncPaymentOrderFromPayOS } from "@/lib/billing/orders"
import { getCurrentDbUser } from "@/lib/server/current-db-user"

const SyncSchema = z.object({
  orderCode: z.coerce.number().int().positive(),
})

export async function POST(req: Request) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = SyncSchema.safeParse(await req.json().catch(() => null))

  if (!parsed.success) {
    return Response.json({ error: "Invalid order code" }, { status: 400 })
  }

  try {
    const billing = await syncPaymentOrderFromPayOS(
      parsed.data.orderCode,
      user.id
    )

    if (!billing) {
      return Response.json({ error: "Payment order not found" }, { status: 404 })
    }

    return Response.json(billing)
  } catch (error) {
    console.error("[billing.sync] payOS sync failed", error)
    return Response.json({ error: "Unable to sync payment" }, { status: 502 })
  }
}
