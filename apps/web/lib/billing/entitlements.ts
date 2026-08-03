import type { BillingTier } from "./catalog"

export const FREE_TEMPLATE_USE_LIMIT = 3

export type TemplateAccessState = {
  locked: boolean
  requiredTier: BillingTier | null
  lockReason: string | null
}

export function getTemplateAccessState(input: {
  tier: BillingTier
  marketplaceIndex: number
  isOwned?: boolean
}): TemplateAccessState {
  if (
    input.isOwned ||
    input.tier !== "FREE" ||
    input.marketplaceIndex < FREE_TEMPLATE_USE_LIMIT
  ) {
    return { locked: false, requiredTier: null, lockReason: null }
  }

  return {
    locked: true,
    requiredTier: "PLUS",
    lockReason: `Free includes ${FREE_TEMPLATE_USE_LIMIT} templates. Upgrade to unlock more.`,
  }
}
