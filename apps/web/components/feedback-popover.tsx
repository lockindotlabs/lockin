"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Textarea } from "@workspace/ui/components/textarea"
import { MessageSquareCodeIcon, MessageSquareDotIcon } from "lucide-react"
import { time } from "node:console"
import React from "react"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"
import { MessageChatSquare } from "@untitledui/icons"

export function FeedbackPopover() {
  return (
    <>
      <Popover>
        <PopoverTrigger
          render={
            <SidebarMenuButton className="data-popup-open:bg-sidebar-accent!">
              <MessageChatSquare data-icon="inline-start" />
              Feedback
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
            placeholder="Type your feedback here..."
            rows={6}
            className="max-h-60 resize-none"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              We don't response to submissions, but we read all of them
              carefully
            </div>
            <Button onClick={() => {}}>Submit</Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
