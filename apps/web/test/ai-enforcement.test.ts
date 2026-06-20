import { mock, describe, it, beforeEach } from "node:test"
import assert from "node:assert"

import { getEffectiveTier } from "../lib/billing/catalog"
import { AI_CATALOG, calculateCredits } from "../lib/ai/catalog"
import { validateAiRequest, checkQuotaAndRecordStarted, checkPlanCap } from "../lib/ai/enforcement"

describe("AI Usage Enforcement Layer Unit Tests", () => {
  describe("Entitlement Resolution", () => {
    it("expired paid tier resolves to Free", () => {
      const pastDate = new Date(Date.now() - 10000)
      const tier = getEffectiveTier("PLUS", pastDate)
      assert.strictEqual(tier, "FREE")
    })

    it("active paid tier stays paid tier", () => {
      const futureDate = new Date(Date.now() + 100000)
      const tier1 = getEffectiveTier("PLUS", futureDate)
      assert.strictEqual(tier1, "PLUS")

      const tier2 = getEffectiveTier("PRO", futureDate)
      assert.strictEqual(tier2, "PRO")
    })

    it("Plus tier cannot use Extended model or complex reasoning", () => {
      const plusConfig = AI_CATALOG.PLUS
      assert.strictEqual(plusConfig.allowedModels.includes("gemini-3.1-pro-preview"), false)
      assert.strictEqual(plusConfig.allowedCapabilities.includes("complex-reasoning"), false)
      assert.strictEqual(plusConfig.allowedCapabilities.includes("web-search"), true)
    })

    it("Pro tier can use Extended model and complex reasoning", () => {
      const proConfig = AI_CATALOG.PRO
      assert.strictEqual(proConfig.allowedModels.includes("gemini-3.1-pro-preview"), true)
      assert.strictEqual(proConfig.allowedCapabilities.includes("complex-reasoning"), true)
      assert.strictEqual(proConfig.allowedCapabilities.includes("web-search"), true)
    })
  })

  describe("Credit Math", () => {
    it("1-999 tokens rounds to 1 credit", () => {
      const res = calculateCredits({ totalTokens: 500, modelName: "gemini-3.1-flash-lite-preview", capabilities: [] })
      assert.strictEqual(res.baseCredits, 1)
      assert.strictEqual(res.creditsCharged, 1)
    })

    it("1001 tokens rounds to 2 credits", () => {
      const res = calculateCredits({ totalTokens: 1001, modelName: "gemini-3.1-flash-lite-preview", capabilities: [] })
      assert.strictEqual(res.baseCredits, 2)
      assert.strictEqual(res.creditsCharged, 2)
    })

    it("Extended model doubles credits (2x multiplier)", () => {
      const res = calculateCredits({ totalTokens: 1001, modelName: "gemini-3.1-pro-preview", capabilities: [] })
      assert.strictEqual(res.multiplier, 2)
      assert.strictEqual(res.creditsCharged, 4) // 2 * 2
    })

    it("complex reasoning doubles credits (2x multiplier)", () => {
      const res = calculateCredits({ totalTokens: 1001, modelName: "gemini-3.1-flash-lite-preview", capabilities: ["complex-reasoning"] })
      assert.strictEqual(res.multiplier, 2)
      assert.strictEqual(res.creditsCharged, 4)
    })

    it("both Extended and complex reasoning still double (2x multiplier, not 4x)", () => {
      const res = calculateCredits({ totalTokens: 1001, modelName: "gemini-3.1-pro-preview", capabilities: ["complex-reasoning"] })
      assert.strictEqual(res.multiplier, 2)
      assert.strictEqual(res.creditsCharged, 4)
    })

    it("missing usage on success charges minimum 1 credit", () => {
      const resNull = calculateCredits({ totalTokens: null, modelName: "gemini-3.1-flash-lite-preview", capabilities: [] })
      assert.strictEqual(resNull.baseCredits, 1)
      assert.strictEqual(resNull.creditsCharged, 1)

      const resZero = calculateCredits({ totalTokens: 0, modelName: "gemini-3.1-flash-lite-preview", capabilities: [] })
      assert.strictEqual(resZero.baseCredits, 1)
      assert.strictEqual(resZero.creditsCharged, 1)
    })
  })

  describe("Request Validation", () => {
    it("rejects unknown model ID", () => {
      const res = validateAiRequest({ tier: "FREE", modelName: "unknown-model", requestedCapabilities: [] })
      assert.strictEqual(res.valid, false)
      assert.strictEqual(res.status, 400)
    })

    it("rejects Extended model for Free tier", () => {
      const res = validateAiRequest({ tier: "FREE", modelName: "gemini-3.1-pro-preview", requestedCapabilities: [] })
      assert.strictEqual(res.valid, false)
      assert.strictEqual(res.status, 403)
      assert.strictEqual(res.error?.code, "AI_FEATURE_NOT_ALLOWED")
    })

    it("rejects web search for Free tier", () => {
      const res = validateAiRequest({ tier: "FREE", modelName: "gemini-3.1-flash-lite-preview", requestedCapabilities: ["web-search"] })
      assert.strictEqual(res.valid, false)
      assert.strictEqual(res.status, 403)
    })

    it("accepts web search for Plus tier", () => {
      const res = validateAiRequest({ tier: "PLUS", modelName: "gemini-3.1-flash-lite-preview", requestedCapabilities: ["web-search"] })
      assert.strictEqual(res.valid, true)
    })

    it("rejects complex reasoning for Plus tier", () => {
      const res = validateAiRequest({ tier: "PLUS", modelName: "gemini-3.1-flash-lite-preview", requestedCapabilities: ["complex-reasoning"] })
      assert.strictEqual(res.valid, false)
      assert.strictEqual(res.status, 403)
    })

    it("accepts complex reasoning and Extended model for Pro tier", () => {
      const res = validateAiRequest({ tier: "PRO", modelName: "gemini-3.1-pro-preview", requestedCapabilities: ["complex-reasoning", "web-search"] })
      assert.strictEqual(res.valid, true)
    })
  })

  describe("Quota Checks and Usage Recording", () => {
    let mockTx: any
    let mockAggregate: any
    let mockCount: any
    let mockCreate: any

    beforeEach(() => {
      mockAggregate = mock.fn(() => Promise.resolve({ _sum: { creditsCharged: 0 } }))
      mockCount = mock.fn(() => Promise.resolve(0))
      mockCreate = mock.fn((args: any) => Promise.resolve({ id: "usage_id", ...args.data }))

      mockTx = {
        aiUsage: {
          aggregate: mockAggregate,
          count: mockCount,
          create: mockCreate,
        },
      }
    })

    it("allows request when below limits, records STARTED status", async () => {
      mockAggregate.mock.mockImplementationOnce(() => Promise.resolve({ _sum: { creditsCharged: 10 } })) // 10 / 50 monthly credits used
      mockCount.mock.mockImplementationOnce(() => Promise.resolve(5)) // 5 / 10 daily requests

      const res = await checkQuotaAndRecordStarted({
        tx: mockTx,
        userId: "user_1",
        chatId: "chat_1",
        requestId: "req_1",
        modelName: "gemini-3.1-flash-lite-preview",
        capabilities: [],
        tier: "FREE",
      })

      assert.strictEqual(res.allowed, true)
      assert.strictEqual(res.remainingCredits, 40)
      assert.strictEqual(mockCreate.mock.calls.length, 1)
      assert.strictEqual(mockCreate.mock.calls[0].arguments[0].data.status, "STARTED")
    })

    it("blocks request on monthly credit exhaustion, records BLOCKED status", async () => {
      mockAggregate.mock.mockImplementationOnce(() => Promise.resolve({ _sum: { creditsCharged: 50 } })) // 50 / 50 monthly credits used

      const res = await checkQuotaAndRecordStarted({
        tx: mockTx,
        userId: "user_1",
        chatId: "chat_1",
        requestId: "req_1",
        modelName: "gemini-3.1-flash-lite-preview",
        capabilities: [],
        tier: "FREE",
      })

      assert.strictEqual(res.allowed, false)
      assert.strictEqual(res.remainingCredits, 0)
      assert.strictEqual(res.reason, "MONTHLY_CREDITS_EXCEEDED")
      assert.strictEqual(mockCreate.mock.calls.length, 1)
      assert.strictEqual(mockCreate.mock.calls[0].arguments[0].data.status, "BLOCKED")
      assert.strictEqual(mockCreate.mock.calls[0].arguments[0].data.reason, "MONTHLY_CREDITS_EXCEEDED")
      // Blocked requests should record 0 credits charged
      assert.strictEqual(mockCreate.mock.calls[0].arguments[0].data.creditsCharged, 0)
    })

    it("blocks request on daily request limit, records BLOCKED status", async () => {
      mockAggregate.mock.mockImplementationOnce(() => Promise.resolve({ _sum: { creditsCharged: 10 } }))
      mockCount.mock.mockImplementationOnce(() => Promise.resolve(10)) // 10 / 10 daily requests used

      const res = await checkQuotaAndRecordStarted({
        tx: mockTx,
        userId: "user_1",
        chatId: "chat_1",
        requestId: "req_1",
        modelName: "gemini-3.1-flash-lite-preview",
        capabilities: [],
        tier: "FREE",
      })

      assert.strictEqual(res.allowed, false)
      assert.strictEqual(res.reason, "DAILY_REQUESTS_EXCEEDED")
      assert.strictEqual(mockCreate.mock.calls.length, 1)
      assert.strictEqual(mockCreate.mock.calls[0].arguments[0].data.status, "BLOCKED")
    })
  })

  describe("AI Plan Cap Enforcement", () => {
    let mockPrisma: any
    let mockFindUnique: any
    let mockCount: any

    beforeEach(() => {
      mockFindUnique = mock.fn(() => Promise.resolve(null))
      mockCount = mock.fn(() => Promise.resolve(0))

      mockPrisma = {
        plan: {
          findUnique: mockFindUnique,
          count: mockCount,
        },
      }
    })

    it("allows creation when under lifetime cap", async () => {
      mockCount.mock.mockImplementationOnce(() => Promise.resolve(2)) // 2 existing AI plans

      const res = await checkPlanCap({
        prisma: mockPrisma,
        userId: "user_1",
        tier: "FREE",
        source: "AI",
        planId: "plan_new",
      })

      assert.strictEqual(res.allowed, true)
    })

    it("blocks creation when at or above lifetime cap", async () => {
      mockCount.mock.mockImplementationOnce(() => Promise.resolve(3)) // 3 existing AI plans

      const res = await checkPlanCap({
        prisma: mockPrisma,
        userId: "user_1",
        tier: "FREE",
        source: "AI",
        planId: "plan_new",
      })

      assert.strictEqual(res.allowed, false)
      assert.strictEqual(res.error?.code, "AI_PLAN_LIMIT_EXCEEDED")
    })

    it("allows plan update even if cap is reached", async () => {
      // Plan exists in DB already (isCreate = false)
      mockFindUnique.mock.mockImplementationOnce(() => Promise.resolve({ id: "plan_existing" }))

      const res = await checkPlanCap({
        prisma: mockPrisma,
        userId: "user_1",
        tier: "FREE",
        source: "AI",
        planId: "plan_existing",
      })

      assert.strictEqual(res.allowed, true)
      assert.strictEqual(mockCount.mock.calls.length, 0) // shouldn't even query plan count
    })

    it("allows manual plans even if cap is reached", async () => {
      const res = await checkPlanCap({
        prisma: mockPrisma,
        userId: "user_1",
        tier: "FREE",
        source: "MANUAL",
        planId: "plan_new",
      })

      assert.strictEqual(res.allowed, true)
    })

    it("allows Plus/Pro users to create unlimited AI plans", async () => {
      const resPlus = await checkPlanCap({
        prisma: mockPrisma,
        userId: "user_1",
        tier: "PLUS",
        source: "AI",
        planId: "plan_new",
      })
      assert.strictEqual(resPlus.allowed, true)

      const resPro = await checkPlanCap({
        prisma: mockPrisma,
        userId: "user_1",
        tier: "PRO",
        source: "AI",
        planId: "plan_new",
      })
      assert.strictEqual(resPro.allowed, true)
    })
  })
})
