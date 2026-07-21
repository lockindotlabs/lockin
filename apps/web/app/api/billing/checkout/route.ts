import { z } from "zod"

import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { BILLING_TIERS, isPaidBillingTier } from "@/lib/billing/catalog"
import { createPendingOrder } from "@/lib/billing/orders"
import { getPayOSClient, resolvePublicWebUrl } from "@/lib/billing/payos"
import prisma from "@workspace/db"

const CheckoutSchema = z.object({
  tier: z.enum(["PLUS", "PRO"]),
})

export async function POST(req: Request) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = CheckoutSchema.safeParse(await req.json().catch(() => null))

  if (!parsed.success || !isPaidBillingTier(parsed.data.tier)) {
    return Response.json({ error: "Invalid billing tier" }, { status: 400 })
  }

  const tier = parsed.data.tier
  const tierConfig = BILLING_TIERS[tier]
  let publicWebUrl: string

  try {
    publicWebUrl = resolvePublicWebUrl(req)
  } catch (error) {
    console.error("[billing.checkout] could not resolve public web url", error)
    return Response.json(
      {
        error:
          "Billing is not configured yet. Set PUBLIC_WEB_URL or open the app from a stable origin.",
      },
      { status: 500 }
    )
  }

  const order = await createPendingOrder(user.id, tier)
  const payOS = getPayOSClient()

  try {
    const paymentLink = await payOS.paymentRequests.create({
      orderCode: order.payosOrderCode,
      amount: tierConfig.amount,
      description: `LockIn ${tierConfig.label}`,
      returnUrl: `${publicWebUrl}/app/billing/return?orderCode=${order.payosOrderCode}`,
      cancelUrl: `${publicWebUrl}/app/billing/cancel?orderCode=${order.payosOrderCode}`,
      items: [
        {
          name: `LockIn ${tierConfig.label}`,
          quantity: 1,
          price: tierConfig.amount,
        },
      ],
    })

    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        paymentLinkId: paymentLink.paymentLinkId,
        checkoutUrl: paymentLink.checkoutUrl,
        rawResponse: paymentLink,
      },
    })

    return Response.json({ checkoutUrl: paymentLink.checkoutUrl })
  } catch (error) {
    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: { status: "FAILED", failedAt: new Date() },
    })

    console.error("[billing.checkout] payOS checkout failed", error)

    return Response.json(
      { error: "Unable to create checkout" },
      { status: 502 }
    )
  }
}
