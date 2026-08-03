"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Textarea } from "@workspace/ui/components/textarea"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"
import { MessageChatSquare } from "@untitledui/icons"
import { useTranslation } from "react-i18next"

export function FeedbackPopover() {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const submitFeedback = async () => {
    const feedback = value.trim()

    if (!feedback || submitting) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: feedback,
          path: window.location.pathname,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      setValue("")
      setSubmitted(true)
      setOpen(false)
    } catch {
      setError(
        t("app.feedback.error", {
          defaultValue: "Could not save feedback. Please try again.",
        })
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <SidebarMenuButton className="data-popup-open:bg-sidebar-accent!">
              <MessageChatSquare data-icon="inline-start" />
              {t("app.feedback.title", { defaultValue: "Feedback" })}
            </SidebarMenuButton>
          }
        />
        <PopoverContent
          align="end"
          side="right"
          sideOffset={24}
          className={"group min-w-80 gap-3 p-3"}
        >
          <Textarea
            placeholder={t("app.feedback.placeholder", {
              defaultValue: "Type your feedback here...",
            })}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setSubmitted(false)
              setError(null)
            }}
            rows={6}
            className="max-h-60 resize-none"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="text-2xs text-muted-foreground">
              {error
                ? error
                : submitted
                  ? t("app.feedback.saved", {
                      defaultValue: "Thanks, your feedback was saved.",
                    })
                  : t("app.feedback.note", {
                      defaultValue:
                      "We do not respond to submissions, but we read all of them carefully.",
                  })}
            </div>
            <Button
              onClick={submitFeedback}
              disabled={!value.trim() || submitting}
            >
              {submitting
                ? t("app.feedback.saving", { defaultValue: "Saving..." })
                : t("app.feedback.submit", { defaultValue: "Submit" })}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
