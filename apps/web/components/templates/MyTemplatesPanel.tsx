"use client"

import * as React from "react"
import Link from "next/link"
import {
  Loader2Icon,
  PencilIcon,
  SendHorizonalIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"

type OwnedTemplate = {
  id: string
  title: string
  category: string
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
  rejectionReason: string | null
  updatedAt: string
  steps: Array<{ id: string }>
}

const STATUS_LABEL_KEYS: Record<OwnedTemplate["status"], string> = {
  DRAFT: "app.templates.mine.status.draft",
  PENDING_REVIEW: "app.templates.mine.status.pendingReview",
  APPROVED: "app.templates.mine.status.approved",
  REJECTED: "app.templates.mine.status.rejected",
}

export function MyTemplatesPanel() {
  const { t } = useTranslation()
  const [templates, setTemplates] = React.useState<OwnedTemplate[]>([])
  const [loadingActionId, setLoadingActionId] = React.useState<string | null>(
    null
  )
  const [isLoaded, setIsLoaded] = React.useState(false)

  const loadTemplates = React.useCallback(async () => {
    const response = await fetch("/api/templates/mine")
    const data = (await response.json()) as { templates?: OwnedTemplate[] }
    setTemplates(data.templates ?? [])
    setIsLoaded(true)
  }, [])

  React.useEffect(() => {
    void loadTemplates().catch(() => setIsLoaded(true))
  }, [loadTemplates])

  const runAction = async (
    templateId: string,
    action: "submit" | "unpublish" | "delete"
  ) => {
    setLoadingActionId(templateId)

    try {
      const url =
        action === "submit"
          ? `/api/templates/mine/${templateId}/submit`
          : action === "unpublish"
            ? `/api/templates/mine/${templateId}/unpublish`
            : `/api/templates/mine/${templateId}`

      await fetch(url, {
        method: action === "delete" ? "DELETE" : "POST",
      })

      await loadTemplates()
    } finally {
      setLoadingActionId(null)
    }
  }

  if (!isLoaded) {
    return (
      <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
        {t("app.templates.mine.loading")}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <p className="text-sm font-medium">
          {t("app.templates.mine.emptyTitle")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("app.templates.mine.emptyDescription")}
        </p>
        <Link
          href="/app/templates/editor/new"
          className={buttonVariants({ size: "sm", className: "mt-4" })}
        >
          {t("app.templates.createNew")}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => {
        const isBusy = loadingActionId === template.id

        return (
          <section
            key={template.id}
            className="rounded-2xl border bg-background p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium">{template.title}</h3>
                  <Badge variant="secondary">
                    {t(STATUS_LABEL_KEYS[template.status])}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("app.templates.mine.summary", {
                    category: template.category,
                    count: template.steps.length,
                  })}
                </p>
                {template.rejectionReason ? (
                  <p className="mt-2 text-sm text-red-600">
                    {t("app.templates.mine.rejectionReason", {
                      reason: template.rejectionReason,
                    })}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/app/templates/editor/${template.id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <PencilIcon className="size-4" />
                  {t("app.templates.mine.edit")}
                </Link>

                {template.status === "DRAFT" ||
                template.status === "REJECTED" ? (
                  <Button
                    size="sm"
                    onClick={() => void runAction(template.id, "submit")}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <SendHorizonalIcon className="size-4" />
                    )}
                    {t("app.templates.mine.submit")}
                  </Button>
                ) : null}

                {template.status === "APPROVED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void runAction(template.id, "unpublish")}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <UploadIcon className="size-4" />
                    )}
                    {t("app.templates.mine.unpublish")}
                  </Button>
                ) : null}

                {template.status !== "APPROVED" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void runAction(template.id, "delete")}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <Trash2Icon className="size-4" />
                    )}
                    {t("app.templates.mine.delete")}
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
