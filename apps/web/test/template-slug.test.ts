import assert from "node:assert"
import { describe, it } from "node:test"

import {
  generateUserTemplateSlug,
  slugifyTemplateTitle,
} from "../lib/server/template-authoring-helpers"

describe("Template slug helpers", () => {
  it("strips Vietnamese diacritics and punctuation", () => {
    assert.strictEqual(
      slugifyTemplateTitle("Kế hoạch học nhóm: CP1!"),
      "ke-hoach-hoc-nhom-cp1"
    )
  })

  it("prefixes user slugs and preserves suffix", () => {
    const slug = generateUserTemplateSlug("Mẫu lập kế hoạch", "abc123")
    assert.strictEqual(slug, "user-mau-lap-ke-hoach-abc123")
  })

  it("falls back when the title has no slug characters", () => {
    const slug = generateUserTemplateSlug("!!!", "zz9999")
    assert.strictEqual(slug, "user-template-zz9999")
  })
})
