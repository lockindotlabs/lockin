"use client"

import * as React from "react"
import { Bell01 } from "@untitledui/icons"
import { ArrowRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverTitle,
} from "@workspace/ui/components/popover"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"

export function NotificationPopover() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant={"outline"} size={"icon-sm"}>
            <Bell01 />
          </Button>
        }
      />
      <PopoverContent
        className="w-80 overflow-hidden p-0 sm:w-96"
        align="end"
        sideOffset={16}
      >
        <PopoverTitle className="sr-only">Changelog Updates</PopoverTitle>
        <ScrollArea className="max-h-125 w-full overflow-y-auto">
          <div className="flex flex-col p-2">
            {/* Notification Item 1: Flows Agent */}
            <div className="flex flex-col gap-3 rounded-lg p-3 transition-colors hover:bg-muted">
              <div className="flex cursor-pointer items-center gap-1 font-medium text-foreground hover:underline">
                <span>Introducing Flows Agent</span>
                <ArrowRight className="size-4" />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Describe what you want to create. An AI agent builds the full
                workflow, selects models, and runs generations. Iterate through
                conversation.
              </p>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600">
                <div className="absolute inset-0 bg-black/5" />
                <div className="flex h-full flex-col justify-center gap-2 p-6 text-center text-white">
                  <span className="text-[10px] font-semibold tracking-wider uppercase opacity-85">
                    LockIn Creative
                  </span>
                  <h4 className="text-xl leading-tight font-bold tracking-tight">
                    Introducing
                    <br />
                    Flows Agent
                  </h4>
                </div>
              </div>
              <span className="text-2xs text-muted-foreground">14 days ago</span>
            </div>

            <Separator className={"my-2"} />

            {/* Notification Item 2: Dubbing v2 */}
            <div className="flex flex-col gap-3 rounded-lg p-3 transition-colors hover:bg-muted">
              <div className="flex items-start gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <h4 className="cursor-pointer leading-snug font-medium text-foreground hover:underline">
                    Introducing Dubbing v2
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Our revolutionary new end-to-end AI dubbing model which
                    preserves the tone, emotion, and delivery of the original
                    performance across 90+ languages.
                  </p>
                </div>
                <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-emerald-950 via-teal-900 to-stone-900 p-2 text-center">
                  <span className="text-[10px] font-bold tracking-tight text-emerald-300">
                    Dubbing{" "}
                    <span className="rounded border border-emerald-700/50 bg-emerald-900/80 px-1.5 py-0.5 text-[8px] text-emerald-200">
                      v2 alpha
                    </span>
                  </span>
                </div>
              </div>
              <span className="text-2xs text-muted-foreground">22 days ago</span>
            </div>

            <Separator className={"my-2"} />

            {/* Notification Item 3: Music v2 */}
            <div className="flex flex-col gap-3 rounded-lg p-4 transition-colors hover:bg-muted">
              <div className="flex items-start gap-4">
                <div className="flex flex-1 flex-col gap-1.5">
                  <h4 className="cursor-pointer leading-snug font-medium text-foreground hover:underline">
                    Introducing Music v2
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Create professional-grade tracks with complete control over
                    instrumentation, tempo, and style using our state-of-the-art
                    music generation tool.
                  </p>
                </div>
                <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/10 bg-gradient-to-br from-neutral-900 via-rose-950 to-orange-950 p-2 text-center">
                  <span className="text-[10px] font-bold tracking-tight text-rose-300">
                    Music{" "}
                    <span className="rounded border border-rose-700/50 bg-rose-900/80 px-1.5 py-0.5 text-[8px] text-rose-200">
                      v2
                    </span>
                  </span>
                </div>
              </div>
              <span className="text-2xs text-muted-foreground">1 month ago</span>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
