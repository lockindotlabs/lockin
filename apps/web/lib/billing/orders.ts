import prisma from "@workspace/db"
import type { PaymentLinkStatus } from "@payos/node"
import type { PaymentOrderUpdateInput } from "@workspace/db/generated/models.ts"

import {
  BILLING_TIERS,
  getEffectiveTier,
  type BillingTier,
} from "@/lib/billing/catalog"
import { getPayOSClient } from "@/lib/billing/payos"

export type LatestPaymentOrder = {
  id: string
  tier: BillingTier
  amount: number
  currency: string
  status: string
  checkoutUrl: string | null
  payosOrderCode: number
  createdAt: string
  updatedAt: string
}

const PAID_DAYS = 30

export type BillingState = {
  tier: BillingTier
  storedTier: BillingTier
  planExpiresAt: string | null
  latestOrder: LatestPaymentOrder | null
}

function addPaidDays(date: Date) {
  const expiresAt = new Date(date)
  expiresAt.setDate(expiresAt.getDate() + PAID_DAYS)
  return expiresAt
}

export function serializeLatestOrder(
  order: {
    id: string
    tier: BillingTier
    amount: number
    currency: string
    status: string
    checkoutUrl: string | null
    payosOrderCode: number
    createdAt: Date
    updatedAt: Date
  } | null
): LatestPaymentOrder | null {
  if (!order) {
    return null
  }

  return {
    id: order.id,
    tier: order.tier,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    checkoutUrl: order.checkoutUrl,
    payosOrderCode: order.payosOrderCode,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}

export async function getBillingState(userId: string): Promise<BillingState> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      planTier: true,
      planExpiresAt: true,
    },
  })
  const latestOrder = await prisma.paymentOrder.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  return {
    tier: getEffectiveTier(user.planTier, user.planExpiresAt),
    storedTier: user.planTier,
    planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
    latestOrder: serializeLatestOrder(latestOrder),
  }
}

export async function createPendingOrder(userId: string, tier: Exclude<BillingTier, "FREE">) {
  const amount = BILLING_TIERS[tier].amount

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const payosOrderCode =
      ((Math.floor(Date.now() / 1000) % 1_000_000) * 1000) +
      Math.floor(Math.random() * 1000)

    try {
      return await prisma.paymentOrder.create({
        data: {
          userId,
          tier,
          amount,
          payosOrderCode,
        },
      })
    } catch (error) {
      if (attempt === 4) {
        throw error
      }
    }
  }

  throw new Error("Unable to create payment order")
}

type ApplyPaymentStatusInput = {
  orderCode: number
  payosStatus: PaymentLinkStatus | "FAILED"
  userId?: string
  rawWebhook?: PaymentOrderUpdateInput["rawWebhook"]
  rawResponse?: PaymentOrderUpdateInput["rawResponse"]
}

export async function applyPaymentStatus({
  orderCode,
  payosStatus,
  userId,
  rawWebhook,
  rawResponse,
}: ApplyPaymentStatusInput) {
  const order = await prisma.paymentOrder.findFirst({
    where: {
      payosOrderCode: orderCode,
      ...(userId ? { userId } : {}),
    },
  })

  if (!order) {
    return null
  }

  const now = new Date()

  return prisma.$transaction(async (tx) => {
    const currentOrder = await tx.paymentOrder.findUniqueOrThrow({
      where: { id: order.id },
    })

    const baseData: PaymentOrderUpdateInput = {
      ...(rawWebhook !== undefined ? { rawWebhook } : {}),
      ...(rawResponse !== undefined ? { rawResponse } : {}),
    }

    if (payosStatus === "PAID") {
      if (currentOrder.status === "PAID") {
        return tx.paymentOrder.update({
          where: { id: currentOrder.id },
          data: baseData,
        })
      }

      const updatedOrder = await tx.paymentOrder.update({
        where: { id: currentOrder.id },
        data: {
          ...baseData,
          status: "PAID",
          paidAt: now,
        },
      })

      await tx.user.update({
        where: { id: currentOrder.userId },
        data: {
          planTier: currentOrder.tier,
          planExpiresAt: addPaidDays(now),
        },
      })

      return updatedOrder
    }

    if (currentOrder.status === "PAID") {
      return tx.paymentOrder.update({
        where: { id: currentOrder.id },
        data: baseData,
      })
    }

    if (payosStatus === "CANCELLED") {
      return tx.paymentOrder.update({
        where: { id: currentOrder.id },
        data: {
          ...baseData,
          status: "CANCELLED",
          cancelledAt: currentOrder.cancelledAt ?? now,
        },
      })
    }

    if (payosStatus === "EXPIRED") {
      return tx.paymentOrder.update({
        where: { id: currentOrder.id },
        data: {
          ...baseData,
          status: "EXPIRED",
          failedAt: currentOrder.failedAt ?? now,
        },
      })
    }

    if (payosStatus === "FAILED") {
      return tx.paymentOrder.update({
        where: { id: currentOrder.id },
        data: {
          ...baseData,
          status: "FAILED",
          failedAt: currentOrder.failedAt ?? now,
        },
      })
    }

    return tx.paymentOrder.update({
      where: { id: currentOrder.id },
      data: baseData,
    })
  })
}

export async function syncPaymentOrderFromPayOS(orderCode: number, userId: string) {
  const order = await prisma.paymentOrder.findFirst({
    where: { payosOrderCode: orderCode, userId },
  })

  if (!order) {
    return null
  }

  const paymentLink = await getPayOSClient().paymentRequests.get(orderCode)
  const status =
    paymentLink.status === "PAID" ||
    paymentLink.status === "CANCELLED" ||
    paymentLink.status === "EXPIRED" ||
    paymentLink.status === "FAILED"
      ? paymentLink.status
      : "PENDING"

  await applyPaymentStatus({
    orderCode,
    userId,
    payosStatus: status,
    rawResponse: paymentLink,
  })

  return getBillingState(userId)
}
