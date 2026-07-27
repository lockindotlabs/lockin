import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildMarketplaceTemplateDetail,
  buildTemplatePrompt,
  type PromptTemplate,
} from "../lib/templates/marketplace-detail"

function createTemplate(overrides: Partial<PromptTemplate> = {}): PromptTemplate {
  return {
    title: "Research sprint",
    description: "Turn raw notes into a submission-ready report.",
    steps: [
      {
        id: "step-1",
        order: 1,
        title: "Thinking - lock the research question",
        estimatedMinutes: 25,
        guidance: "Name the claim the report must prove.",
      },
      {
        id: "step-2",
        order: 2,
        title: "Execution - draft the evidence map",
        estimatedMinutes: 45,
        guidance: "Match each source to one paragraph.",
      },
    ],
    scaffoldQuestions: [
      {
        id: "output",
        order: 1,
        prompt: "What should be ready at the end?",
        helperText: "Be specific about the deliverable.",
      },
    ],
    detail: null,
    ...overrides,
  }
}

describe("marketplace template detail fallback", () => {
  it("builds minimal detail from DB-backed description and scaffold questions", () => {
    const template = createTemplate()

    const detail = buildMarketplaceTemplateDetail(template)

    assert.equal(
      detail.overview,
      "Turn raw notes into a submission-ready report."
    )
    assert.deepEqual(detail.scaffoldFields, [
      {
        id: "output",
        label: "What should be ready at the end?",
        placeholder: "Be specific about the deliverable.",
        helperText: "Be specific about the deliverable.",
      },
    ])
    assert.deepEqual(detail.deliverables, [])
    assert.deepEqual(detail.saveReadinessChecks, [])
  })

  it("keeps hardcoded detail when a template already has one", () => {
    const template = createTemplate({
      detail: {
        overview: "Hardcoded overview",
        whatThisTemplateDoes: ["Preserve me"],
        sprintableWork: ["Draft in one sprint"],
        longRunningWork: [],
        deliverables: ["Deck"],
        saveReadinessChecks: ["Evidence is linked"],
        scaffoldFields: [
          {
            id: "hardcoded",
            label: "Hardcoded question",
            placeholder: "Hardcoded placeholder",
          },
        ],
      },
    })

    const detail = buildMarketplaceTemplateDetail(template)

    assert.equal(detail.overview, "Hardcoded overview")
    assert.equal(detail.scaffoldFields[0]?.id, "hardcoded")
  })
})

describe("marketplace template prompt", () => {
  it("includes template steps and fallback scaffold answers in the prompt", () => {
    const template = createTemplate()

    const prompt = buildTemplatePrompt(template, {
      output: "A checked report draft",
    })

    assert.match(prompt, /workflow tham/)
    assert.match(prompt, /Thinking - lock the research question/)
    assert.match(prompt, /Name the claim the report must prove/)
    assert.match(prompt, /Execution - draft the evidence map/)
    assert.match(prompt, /What should be ready at the end\?: A checked report draft/)
  })
})
