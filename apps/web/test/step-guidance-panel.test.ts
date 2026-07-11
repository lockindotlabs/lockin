import assert from "node:assert/strict"
import { test } from "node:test"

import {
  hasStepGuidance,
  STEP_GUIDANCE_CONTENT_CLASS,
  STEP_GUIDANCE_COLLAPSIBLE_CLASS,
} from "../lib/focus/step-guidance-panel"

test("step guidance panel is hidden when guidance is empty", () => {
  assert.equal(hasStepGuidance(null), false)
  assert.equal(hasStepGuidance(undefined), false)
  assert.equal(hasStepGuidance("   "), false)
})

test("step guidance panel is shown when guidance has text", () => {
  assert.equal(
    hasStepGuidance(
      "Nếu bị kẹt quá 5 phút, quay lại goal rồi làm phần dễ nhất trước."
    ),
    true
  )
})

test("step guidance content is height-limited and scrollable for long text", () => {
  assert.match(STEP_GUIDANCE_CONTENT_CLASS, /max-h-32/)
  assert.match(STEP_GUIDANCE_CONTENT_CLASS, /overflow-y-auto/)
})

test("step guidance content preserves line breaks for multi-line guidance", () => {
  assert.match(STEP_GUIDANCE_CONTENT_CLASS, /whitespace-pre-line/)
})

test("step guidance panel keeps its own collapsible section inside the box", () => {
  // The panel lives under the step title with its own separator, so switching
  // to a step with guidance renders it and a step without guidance renders
  // nothing (hasStepGuidance gates the whole Collapsible).
  assert.match(STEP_GUIDANCE_COLLAPSIBLE_CLASS, /border-t/)
  assert.equal(hasStepGuidance("Ground the first draft in your Sprint Goal."), true)
  assert.equal(hasStepGuidance(""), false)
})
