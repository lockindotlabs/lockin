"use client"

import { useAui, useAuiEvent, type ModelContext } from "@assistant-ui/react"
import { BookOpenIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"

export type WorkflowTemplateSummary = {
  id: string
  slug: string
  title: string
  category: string
  description: string | null
  outputType: string
  isAcademic: boolean
  status?: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
  isOwned?: boolean
}

function useWorkflowTemplates() {
  const [templates, setTemplates] = useState<WorkflowTemplateSummary[]>([])

  useEffect(() => {
    let active = true
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data: { templates: WorkflowTemplateSummary[] }) => {
        if (active) setTemplates(data.templates ?? [])
      })
      .catch(() => {
        if (active) setTemplates([])
      })
    return () => {
      active = false
    }
  }, [])

  return templates
}

export function TemplateConfigRegistrar({
  templateId,
}: {
  templateId: string | null
}) {
  const api = useAui()

  useEffect(() => {
    const context = templateId ? { config: { templateId } } : {}
    return api.modelContext().register({
      getModelContext: () => context as ModelContext,
    })
  }, [api, templateId])

  return null
}

export function TemplateAutoClear({
  onClear,
}: {
  onClear: () => void
}) {
  useAuiEvent("thread.runStart", () => {
    window.setTimeout(onClear, 0)
  })
  return null
}

export function TemplatePicker({
  selectedTemplateId,
  onSelect,
}: {
  selectedTemplateId: string | null
  onSelect: (id: string | null) => void
}) {
  const templates = useWorkflowTemplates()

  const selected = templates.find((t) => t.id === selectedTemplateId) ?? null
  const isUnapprovedOwned = (template: WorkflowTemplateSummary) =>
    template.isOwned && template.status && template.status !== "APPROVED"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={selected ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            aria-label="Select workflow template"
          />
        }
      >
        <BookOpenIcon className="size-3.5" />
        <span>{selected ? selected.title : "Template"}</span>
        {selected && (
          <span
            role="button"
            aria-label="Remove template"
            className="ml-0.5 rounded-sm hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(null)
            }}
          >
            <XIcon className="size-3" />
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {templates.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            No templates available
          </div>
        ) : (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                Workflow templates
              </DropdownMenuLabel>
              {templates.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => onSelect(selectedTemplateId === t.id ? null : t.id)}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <span className="flex items-center gap-2 font-medium leading-tight">
                    {t.title}
                    {isUnapprovedOwned(t) ? (
                      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        Chưa duyệt
                      </span>
                    ) : null}
                  </span>
                  {t.description && (
                    <span className="line-clamp-2 text-xs text-muted-foreground leading-snug">
                      {t.description}
                    </span>
                  )}
                  {selectedTemplateId === t.id && (
                    <span className="mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                      Selected
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            {selectedTemplateId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onSelect(null)}
                  className="text-xs text-muted-foreground"
                >
                  Clear template
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
