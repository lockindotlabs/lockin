import { getPayOSClient } from "@/lib/billing/payos"
import { applyPaymentStatus } from "@/lib/billing/orders"
import prisma from "@workspace/db"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  let webhookData: Awaited<
    ReturnType<ReturnType<typeof getPayOSClient>["webhooks"]["verify"]>
  >

  try {
    webhookData = await getPayOSClient().webhooks.verify(body)
  } catch (error) {
    console.error("[billing.payos-webhook] invalid signature", error)
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  const order = await prisma.paymentOrder.findUnique({
    where: { payosOrderCode: webhookData.orderCode },
  })

  if (!order) {
    return Response.json({ error: "Payment order not found" }, { status: 404 })
  }

  await applyPaymentStatus({
    orderCode: order.payosOrderCode,
    payosStatus:
      body.success === true && webhookData.code === "00" ? "PAID" : "FAILED",
    rawWebhook: body,
  })

  return Response.json({ received: true })
}
