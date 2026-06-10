export const BILLING_TIERS = {
  FREE: {
    label: "Free",
    amount: 0,
    displayPrice: "0 VND",
  },
  PLUS: {
    label: "Plus",
    amount: 2000,
    displayPrice: "2.000 VND",
  },
  PRO: {
    label: "Pro",
    amount: 189000,
    displayPrice: "189.000 VND",
  },
} as const

export type BillingTier = keyof typeof BILLING_TIERS
export type PaidBillingTier = Exclude<BillingTier, "FREE">

export function isPaidBillingTier(value: unknown): value is PaidBillingTier {
  return value === "PLUS" || value === "PRO"
}

export function getEffectiveTier(
  tier: BillingTier | null | undefined,
  expiresAt: Date | string | null | undefined
): BillingTier {
  if (!tier || tier === "FREE" || !expiresAt) {
    return "FREE"
  }

  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)

  if (Number.isNaN(expires.getTime()) || expires <= new Date()) {
    return "FREE"
  }

  return tier
}
