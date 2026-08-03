import assert from "node:assert"
import { describe, it } from "node:test"

import {
  FREE_TEMPLATE_USE_LIMIT,
  getTemplateAccessState,
} from "../lib/billing/entitlements"

describe("template entitlements", () => {
  it("allows the first Free templates", () => {
    const access = getTemplateAccessState({
      tier: "FREE",
      marketplaceIndex: FREE_TEMPLATE_USE_LIMIT - 1,
    })

    assert.strictEqual(access.locked, false)
  })

  it("locks Free templates after the limit", () => {
    const access = getTemplateAccessState({
      tier: "FREE",
      marketplaceIndex: FREE_TEMPLATE_USE_LIMIT,
    })

    assert.strictEqual(access.locked, true)
    assert.strictEqual(access.requiredTier, "PLUS")
  })

  it("allows paid tiers and author-owned templates", () => {
    assert.strictEqual(
      getTemplateAccessState({ tier: "PLUS", marketplaceIndex: 99 }).locked,
      false
    )
    assert.strictEqual(
      getTemplateAccessState({
        tier: "FREE",
        marketplaceIndex: 99,
        isOwned: true,
      }).locked,
      false
    )
  })
})
