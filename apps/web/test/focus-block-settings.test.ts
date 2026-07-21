import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  DEFAULT_HARD_BLOCK_DOMAINS,
  normalizeDomain,
  uniqueDomains,
  withDefaultBlockSuggestions,
} from "@/lib/focus/block-settings"

describe("focus block settings", () => {
  it("normalizes pasted URLs into domains", () => {
    assert.equal(
      normalizeDomain(" https://www.YouTube.com/watch?v=1 "),
      "youtube.com"
    )
  })

  it("deduplicates normalized domains", () => {
    assert.deepEqual(
      uniqueDomains(["x.com", "https://x.com/home", "WWW.Reddit.com"]),
      ["x.com", "reddit.com"]
    )
  })

  it("prefills hard-block suggestions when no saved settings exist", () => {
    const settings = withDefaultBlockSuggestions({
      blocklistHard: [],
      blocklistSoft: [],
      tabGuard: false,
    })

    assert.deepEqual(settings.blocklistHard, DEFAULT_HARD_BLOCK_DOMAINS)
    assert.deepEqual(settings.blocklistSoft, [])
  })

  it("keeps saved settings instead of replacing them with defaults", () => {
    const settings = withDefaultBlockSuggestions({
      blocklistHard: ["example.com"],
      blocklistSoft: ["news.ycombinator.com"],
      tabGuard: true,
    })

    assert.deepEqual(settings, {
      blocklistHard: ["example.com"],
      blocklistSoft: ["news.ycombinator.com"],
      tabGuard: true,
    })
  })
})
