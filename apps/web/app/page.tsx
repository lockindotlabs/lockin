"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  BellDotIcon,
  BellIcon,
  BotMessageSquareIcon,
  BubblesIcon,
  BusIcon,
  ChartGanttIcon,
  FolderIcon,
  HandIcon,
  HdIcon,
  HdmiPortIcon,
  SparklesIcon,
} from "lucide-react"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { LogoWordmark } from "@workspace/ui/components/logo-wordmark"
import { RightAiSidebar } from "@/components/right-ai-sidebar"
import { useState } from "react"

export default function Page() {
  const isMobile = useIsMobile()
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true)

  return (
    <>
      <div className="min-h-svh">
        {isMobile && (
          <>
            <div className="flex flex-row items-center justify-between border-b p-3 text-xs">
              <div className="flex flex-row items-center gap-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-md bg-muted">
                  <LogoWordmark className="h-3" />
                </div>
                <span>Download app for better experiences on mobile</span>
              </div>

              <Button
                variant={"secondary"}
                size={"xs"}
                className={"rounded-full"}
              >
                GET APP
              </Button>
            </div>
          </>
        )}

        <div className="flex h-full">
          <div className="flex-1">
            <div className="flex h-14 items-center justify-between border-b px-3">
              <SidebarTrigger />
              <div className="flex gap-2">
                <div className={`flex gap-2 ${isMobile && "hidden"}`}>
                  <Button variant={"outline"} size={"sm"}>
                    Feedback
                  </Button>
                  <Button variant={"outline"} size={"sm"}>
                    Docs
                  </Button>
                  <Button variant={"outline"} size={"sm"}>
                    <BotMessageSquareIcon data-icon="inline-start" />
                    Ask
                  </Button>
                  <Button variant={"outline"} size={"icon-sm"}>
                    <FolderIcon />
                  </Button>

                  <Button
                    variant={"outline"}
                    onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
                    size={"sm"}
                  >
                    <SparklesIcon data-icon="inline-start" />
                    {isAiSidebarOpen ? "Hide AI" : "Open AI"}
                  </Button>
                </div>

                <Button variant={"outline"} size={"icon-sm"}>
                  <BellDotIcon />
                </Button>
                <Avatar>
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex p-4 px-6">
              <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
                <div>
                  <h1 className="font-medium">Project ready!</h1>
                  <p>You may now add components and start building.</p>
                  <p>We&apos;ve already added the button component for you.</p>
                  <Button variant={"outline"} className="mt-2">
                    Button
                  </Button>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  (Press <kbd>d</kbd> to toggle dark mode)
                </div>
              </div>
            </div>
          </div>
          <RightAiSidebar
            isOpen={isAiSidebarOpen}
            onOpenChange={setIsAiSidebarOpen}
          />
        </div>
      </div>
    </>
  )
}
