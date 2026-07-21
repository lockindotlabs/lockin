import assert from "node:assert"
import { describe, it } from "node:test"

import { flattenPlanStepsForTemplate } from "../lib/server/template-authoring-helpers"

describe("Template snapshot helper", () => {
  it("flattens nested plan steps depth-first and renumbers them", () => {
    const flattened = flattenPlanStepsForTemplate([
      {
        id: "root-1",
        title: "Research",
        description: "Gather raw notes",
        guidance: null,
        estimatedMinutes: 30,
        order: 2,
        parentId: null,
      },
      {
        id: "child-1",
        title: "Interview users",
        description: null,
        guidance: "Talk to 5 people",
        estimatedMinutes: 45,
        order: 3,
        parentId: "root-1",
      },
      {
        id: "root-0",
        title: "Define scope",
        description: null,
        guidance: "Lock the target outcome",
        estimatedMinutes: 20,
        order: 1,
        parentId: null,
      },
    ])

    assert.deepStrictEqual(flattened, [
      {
        order: 1,
        title: "Define scope",
        guidance: "Lock the target outcome",
        estimatedMinutes: 20,
      },
      {
        order: 2,
        title: "Research",
        guidance: "Gather raw notes",
        estimatedMinutes: 30,
      },
      {
        order: 3,
        title: "Interview users",
        guidance: "(Thuoc buoc: Research) Talk to 5 people",
        estimatedMinutes: 45,
      },
    ])
  })

  it("falls back to description and keeps parent prefix for child steps", () => {
    const flattened = flattenPlanStepsForTemplate([
      {
        id: "parent",
        title: "Build outline",
        description: null,
        guidance: null,
        estimatedMinutes: 15,
        order: 1,
        parentId: null,
      },
      {
        id: "child",
        title: "Draft section one",
        description: "Use the notes from class",
        guidance: null,
        estimatedMinutes: 25,
        order: 2,
        parentId: "parent",
      },
    ])

    assert.strictEqual(
      flattened[1]?.guidance,
      "(Thuoc buoc: Build outline) Use the notes from class"
    )
  })

  it("rejects snapshots longer than 40 steps", () => {
    const steps = Array.from({ length: 41 }, (_, index) => ({
      id: `step-${index + 1}`,
      title: `Step ${index + 1}`,
      description: null,
      guidance: null,
      estimatedMinutes: 10,
      order: index,
      parentId: null,
    }))

    assert.throws(
      () => flattenPlanStepsForTemplate(steps),
      /support up to 40 steps/
    )
  })
})
