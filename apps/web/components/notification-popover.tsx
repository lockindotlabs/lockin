"use client"

import * as React from "react"
import { Bell01 } from "@untitledui/icons"
import { ArrowRight, BellOff, RotateCcw, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverTitle,
} from "@workspace/ui/components/popover"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
import { AnimatePresence, motion } from "framer-motion"

export function NotificationPopover() {
  const [visibleIds, setVisibleIds] = React.useState<string[]>([
    "flows",
    "dubbing",
    "music",
  ])

  const hasFlows = visibleIds.includes("flows")
  const hasDubbing = visibleIds.includes("dubbing")
  const hasMusic = visibleIds.includes("music")

  const dismissNotification = (id: string) => {
    setVisibleIds((prev) => prev.filter((item) => item !== id))
  }

  const restoreNotifications = () => {
    setVisibleIds(["flows", "dubbing", "music"])
  }

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
        className="w-80 overflow-hidden p-0 sm:w-96 flex flex-col"
        align="end"
        sideOffset={16}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 bg-muted/20">
          <PopoverTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bell01 className="size-4 text-primary animate-pulse" />
            What&apos;s New
          </PopoverTitle>
          {visibleIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-2xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setVisibleIds([])}
            >
              Clear all
            </Button>
          )}
        </div>

        {visibleIds.length > 0 ? (
          <ScrollArea className="max-h-125 w-full overflow-y-auto">
            <div className="flex flex-col p-2">
              <AnimatePresence initial={false}>
                {hasFlows && (
                  <motion.div
                    key="flows"
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      marginTop: 0,
                      marginBottom: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      overflow: "hidden",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative group flex flex-col gap-3 rounded-lg p-3 transition-colors hover:bg-muted">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          dismissNotification("flows")
                        }}
                        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 hover:bg-muted-foreground/10 hover:text-foreground group-hover:opacity-100 transition-opacity"
                        aria-label="Dismiss notification"
                      >
                        <X className="size-3.5" />
                      </button>
                      <div className="flex cursor-pointer items-center gap-1 font-medium text-foreground hover:underline">
                        <span>Introducing Flows Agent</span>
                        <ArrowRight className="size-4" />
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground pr-4">
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

                    {(hasDubbing || hasMusic) && <Separator className="my-2" />}
                  </motion.div>
                )}

                {hasDubbing && (
                  <motion.div
                    key="dubbing"
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      marginTop: 0,
                      marginBottom: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      overflow: "hidden",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative group flex flex-col gap-3 rounded-lg p-3 transition-colors hover:bg-muted">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          dismissNotification("dubbing")
                        }}
                        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 hover:bg-muted-foreground/10 hover:text-foreground group-hover:opacity-100 transition-opacity"
                        aria-label="Dismiss notification"
                      >
                        <X className="size-3.5" />
                      </button>
                      <div className="flex items-start gap-3">
                        <div className="flex flex-1 flex-col gap-1.5 pr-4">
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

                    {hasMusic && <Separator className="my-2" />}
                  </motion.div>
                )}

                {hasMusic && (
                  <motion.div
                    key="music"
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      marginTop: 0,
                      marginBottom: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      overflow: "hidden",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative group flex flex-col gap-3 rounded-lg p-4 transition-colors hover:bg-muted">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          dismissNotification("music")
                        }}
                        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 hover:bg-muted-foreground/10 hover:text-foreground group-hover:opacity-100 transition-opacity"
                        aria-label="Dismiss notification"
                      >
                        <X className="size-3.5" />
                      </button>
                      <div className="flex items-start gap-4">
                        <div className="flex flex-1 flex-col gap-1.5 pr-4">
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]"
          >
            {/* Glowing Bell Icon Container */}
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              {/* Outer decorative ring */}
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-25" />
              <div className="absolute inset-0 rounded-full border border-primary/25 scale-110 opacity-75" />
              <BellOff className="size-6 text-primary animate-bounce" />
            </div>

            <h3 className="mb-1 text-sm font-semibold text-foreground">
              You&apos;re all caught up!
            </h3>
            <p className="mb-6 max-w-[240px] text-xs text-muted-foreground leading-relaxed">
              No new updates or announcements. We&apos;ll notify you when they arrive.
            </p>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-xs font-medium border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-300"
              onClick={restoreNotifications}
            >
              <RotateCcw className="size-3.5" />
              Restore notifications
            </Button>
          </motion.div>
        )}
      </PopoverContent>
    </Popover>
  )
}

