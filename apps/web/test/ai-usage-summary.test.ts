import { mock, describe, it, beforeEach } from "node:test"
import assert from "node:assert"

import { getAiUsageSummary } from "../lib/ai/enforcement"

describe("AI Usage Summary Helper Unit Tests", () => {
  let mockPrisma: any
  let mockAggregate: any
  let mockCount: any

  beforeEach(() => {
    mockAggregate = mock.fn(() => Promise.resolve({ _sum: { creditsCharged: 0 } }))
    mockCount = mock.fn(() => Promise.resolve(0))

    mockPrisma = {
      aiUsage: {
        aggregate: mockAggregate,
      },
      plan: {
        count: mockCount,
      },
    }
  })

  it("Free user with partial credit usage and AI-plan count", async () => {
    mockAggregate.mock.mockImplementationOnce(() => Promise.resolve({ _sum: { creditsCharged: 20 } })) // 20 / 50 monthly credits used
    mockCount.mock.mockImplementationOnce(() => Promise.resolve(2)) // 2 AI-created plans

    const testNow = new Date("2026-06-15T12:00:00Z")
    const user = {
      id: "user_free",
      planTier: "FREE" as const,
      planExpiresAt: null,
    }

    const summary = await getAiUsageSummary({
      prisma: mockPrisma,
      user,
      now: testNow,
    })

    assert.strictEqual(summary.tier, "FREE")
    
    // Credits
    assert.strictEqual(summary.credits.used, 20)
    assert.strictEqual(summary.credits.limit, 50)
    assert.strictEqual(summary.credits.remaining, 30)
    assert.strictEqual(summary.credits.percentUsed, 40)
    assert.strictEqual(summary.credits.resetAt, "2026-07-01T00:00:00.000Z")

    // AI Plans
    assert.strictEqual(summary.aiPlans.created, 2)
    assert.strictEqual(summary.aiPlans.limit, 3)
    assert.strictEqual(summary.aiPlans.remaining, 1)
    assert.strictEqual(summary.aiPlans.percentUsed, (2 / 3) * 100)
  })

  it("exhausted credits clamp remaining to 0", async () => {
    // 60 credits charged, which is > 50 limit
    mockAggregate.mock.mockImplementationOnce(() => Promise.resolve({ _sum: { creditsCharged: 60 } }))
    mockCount.mock.mockImplementationOnce(() => Promise.resolve(1))

    const testNow = new Date("2026-06-15T12:00:00Z")
    const user = {
      id: "user_exhausted",
      planTier: "FREE" as const,
      planExpiresAt: null,
    }

    const summary = await getAiUsageSummary({
      prisma: mockPrisma,
      user,
      now: testNow,
    })

    assert.strictEqual(summary.tier, "FREE")
    assert.strictEqual(summary.credits.used, 60)
    assert.strictEqual(summary.credits.limit, 50)
    assert.strictEqual(summary.credits.remaining, 0) // clamped to 0
    assert.strictEqual(summary.credits.percentUsed, 100) // clamped to 100
  })

  it("Plus/Pro return aiPlans.limit: null", async () => {
    mockAggregate.mock.mockImplementationOnce(() => Promise.resolve({ _sum: { creditsCharged: 150 } }))
    mockCount.mock.mockImplementationOnce(() => Promise.resolve(4))

    const testNow = new Date("2026-06-15T12:00:00Z")
    const user = {
      id: "user_plus",
      planTier: "PLUS" as const,
      planExpiresAt: new Date("2027-06-15T12:00:00Z"),
    }

    const summary = await getAiUsageSummary({
      prisma: mockPrisma,
      user,
      now: testNow,
    })

    assert.strictEqual(summary.tier, "PLUS")
    assert.strictEqual(summary.credits.used, 150)
    assert.strictEqual(summary.credits.limit, 1000)
    assert.strictEqual(summary.credits.remaining, 850)
    assert.strictEqual(summary.credits.percentUsed, 15)

    // AI Plans
    assert.strictEqual(summary.aiPlans.created, 4)
    assert.strictEqual(summary.aiPlans.limit, null)
    assert.strictEqual(summary.aiPlans.remaining, null)
    assert.strictEqual(summary.aiPlans.percentUsed, null)
  })

  it("reset date is next UTC month boundary", async () => {
    const testNow = new Date("2026-12-31T23:59:59Z")
    const user = {
      id: "user_reset",
      planTier: "PRO" as const,
      planExpiresAt: new Date("2027-12-31T23:59:59Z"),
    }

    const summary = await getAiUsageSummary({
      prisma: mockPrisma,
      user,
      now: testNow,
    })

    // Dec 31 -> Jan 1 of next year
    assert.strictEqual(summary.credits.resetAt, "2027-01-01T00:00:00.000Z")
  })
})
