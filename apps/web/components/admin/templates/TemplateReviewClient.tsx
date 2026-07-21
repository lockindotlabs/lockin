"use client"

import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type ReviewTemplate = {
  id: string
  title: string
  authorName: string | null
  category: string
  submittedAt: string | null
  steps: Array<{ id: string; order: number; title: string }>
}

export function TemplateReviewClient() {
  const [templates, setTemplates] = React.useState<ReviewTemplate[]>([])
  const [reasonById, setReasonById] = React.useState<Record<string, string>>({})

  const loadTemplates = React.useCallback(async () => {
    const response = await fetch("/api/admin/templates")
    const data = (await response.json()) as { templates?: ReviewTemplate[] }
    setTemplates(data.templates ?? [])
  }, [])

  React.useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    await fetch(`/api/admin/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "APPROVE"
          ? { action }
          : { action, reason: reasonById[id] || "Can bo sung chat luong template." }
      ),
    })

    await loadTemplates()
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <section key={template.id} className="rounded-2xl border bg-background p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium">{template.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {template.authorName ?? "Unknown author"} • {template.category}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void handleAction(template.id, "APPROVE")}>
                Duyet
              </Button>
              <Button size="sm" variant="outline" onClick={() => void handleAction(template.id, "REJECT")}>
                Tu choi
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium">Preview steps</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {template.steps.map((step) => (
                <li key={step.id}>
                  {step.order}. {step.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Ly do tu choi</label>
            <Input
              value={reasonById[template.id] ?? ""}
              onChange={(event) =>
                setReasonById((current) => ({
                  ...current,
                  [template.id]: event.target.value,
                }))
              }
              placeholder="Chi can dien khi tu choi"
            />
          </div>
        </section>
      ))}

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Khong co template nao dang cho duyet.
        </div>
      ) : null}
    </div>
  )
}
