import { getEffectiveTier } from "../billing/catalog"
import type { BillingTier } from "../billing/catalog"

export type AiCapability = "web-search" | "complex-reasoning"

export interface AiTierConfig {
  creditsPerMonth: number
  requestsPerDay: number
  allowedModels: string[]
  allowedCapabilities: AiCapability[]
  lifetimePlanCap: number | null // null means unlimited
}

export const AI_CATALOG: Record<BillingTier, AiTierConfig> = {
  FREE: {
    creditsPerMonth: 50,
    requestsPerDay: 10,
    allowedModels: ["gemini-3.1-flash-lite-preview", "gemini-3.1-flash-preview"],
    allowedCapabilities: [],
    lifetimePlanCap: 3,
  },
  PLUS: {
    creditsPerMonth: 1000,
    requestsPerDay: 100,
    allowedModels: ["gemini-3.1-flash-lite-preview", "gemini-3.1-flash-preview"],
    allowedCapabilities: ["web-search"],
    lifetimePlanCap: null,
  },
  PRO: {
    creditsPerMonth: 3000,
    requestsPerDay: 300,
    allowedModels: [
      "gemini-3.1-flash-lite-preview",
      "gemini-3.1-flash-preview",
      "gemini-3.1-pro-preview",
    ],
    allowedCapabilities: ["web-search", "complex-reasoning"],
    lifetimePlanCap: null,
  },
}

// Credit calculation helper
export function calculateCredits({
  totalTokens,
  modelName,
  capabilities,
}: {
  totalTokens?: number | null
  modelName: string
  capabilities: string[]
}): {
  baseCredits: number
  multiplier: number
  creditsCharged: number
} {
  const tokens = totalTokens ?? 0
  // 1 credit = 1,000 normalized AI tokens, rounded up, minimum 1 credit
  // If tokens is missing or 0, charge minimum 1 credit.
  const baseCredits = tokens === 0 ? 1 : Math.max(1, Math.ceil(tokens / 1000))

  // Extended model or complex reasoning applies a 2x multiplier; if both are used, still 2x, not 4x
  const isExtended = modelName === "gemini-3.1-pro-preview"
  const hasComplexReasoning = capabilities.includes("complex-reasoning")
  const multiplier = (isExtended || hasComplexReasoning) ? 2 : 1

  return {
    baseCredits,
    multiplier,
    creditsCharged: baseCredits * multiplier,
  }
}
