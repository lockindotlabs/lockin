"use client"

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

  return (
    <>
      <Popover>
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
            rows={6}
            className="max-h-60 resize-none"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="text-2xs text-muted-foreground">
              {t("app.feedback.note", {
                defaultValue:
                  "We do not respond to submissions, but we read all of them carefully.",
              })}
            </div>
            <Button onClick={() => {}}>
              {t("app.feedback.submit", { defaultValue: "Submit" })}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
