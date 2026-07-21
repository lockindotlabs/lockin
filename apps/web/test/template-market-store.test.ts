import assert from "node:assert/strict"
import { test } from "node:test"

import { buildMarketTemplateWhere } from "../lib/server/template-market-store"

test("market template query includes approved templates and templates authored by current user", () => {
  const where = buildMarketTemplateWhere({ userId: "user_123" })

  assert.deepEqual(where, {
    AND: [
      { OR: [{ status: "APPROVED" }, { authorId: "user_123" }] },
    ],
  })
})

test("market template query keeps approved-only visibility for anonymous lookups", () => {
  const where = buildMarketTemplateWhere({})

  assert.deepEqual(where, {
    AND: [{ status: "APPROVED" }],
  })
})

test("market template query composes visibility with search and category filters", () => {
  const where = buildMarketTemplateWhere({
    userId: "user_123",
    category: "Study",
    search: "essay",
  })

  assert.deepEqual(where, {
    AND: [
      { OR: [{ status: "APPROVED" }, { authorId: "user_123" }] },
      { category: "Study" },
      {
        OR: [
          { title: { contains: "essay", mode: "insensitive" } },
          { description: { contains: "essay", mode: "insensitive" } },
          { domainTags: { has: "essay" } },
        ],
      },
    ],
  })
})
