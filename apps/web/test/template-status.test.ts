import assert from "node:assert"
import { describe, it } from "node:test"

import { canTransitionTemplateStatus } from "../lib/server/template-authoring-helpers"

describe("Template status transitions", () => {
  it("allows the authoring and review lifecycle transitions", () => {
    assert.strictEqual(canTransitionTemplateStatus("DRAFT", "PENDING_REVIEW"), true)
    assert.strictEqual(
      canTransitionTemplateStatus("PENDING_REVIEW", "APPROVED"),
      true
    )
    assert.strictEqual(
      canTransitionTemplateStatus("PENDING_REVIEW", "REJECTED"),
      true
    )
    assert.strictEqual(canTransitionTemplateStatus("APPROVED", "DRAFT"), true)
    assert.strictEqual(canTransitionTemplateStatus("REJECTED", "DRAFT"), true)
  })

  it("rejects invalid transitions", () => {
    assert.strictEqual(canTransitionTemplateStatus("DRAFT", "APPROVED"), false)
    assert.strictEqual(
      canTransitionTemplateStatus("APPROVED", "PENDING_REVIEW"),
      false
    )
    assert.strictEqual(canTransitionTemplateStatus("REJECTED", "APPROVED"), false)
  })
})
