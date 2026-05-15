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
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

const NotificationsPopover = () => {
  return (
    <>
      <Popover>
        <PopoverTrigger
          render={
            <Button variant={"outline"} size={"icon-sm"}>
              <BellDotIcon />
            </Button>
          }
        />

        <PopoverContent
          className={"min-w-100"}
          align="end"
          side="bottom"
          sideOffset={12}
        >
          <ScrollArea className={"h-[50vh] rounded-lg pr-2"}>
            <div className="prose max-w-none text-sm">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>

              <p>
                Curabitur pretium tincidunt lacus. Nulla gravida orci a odio.
                Nullam varius, turpis et commodo pharetra, est eros bibendum
                elit, nec luctus magna felis sollicitudin mauris. Integer in
                mauris eu nibh euismod gravida. Duis ac tellus et risus
                vulputate vehicula. Donec lobortis risus a elit. Etiam tempor.
                Ut ullamcorper, ligula eu tempor congue, eros est euismod
                turpis, id tincidunt sapien risus a quam. Maecenas fermentum
                consequat mi. Donec fermentum. Pellentesque malesuada nulla a
                mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis,
                neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl
                adipiscing sapien, sed malesuada diam lacus eget erat. Cras
                mollis scelerisque nunc. Nullam arcu. Aliquam at mauris eu nunc
                bibendum sollicitudin. Praesent congue erat at massa. Sed cursus
                turpis vitae tortor.
              </p>

              <p>
                Phasellus consectetuer vestibulum elit. Aenean tellus metus,
                bibendum sed, posuere ac, mattis non, nunc. Vestibulum fringilla
                pede sit amet augue. In turpis. Pellentesque posuere. Praesent
                turpis. Aenean posuere, tortor sed cursus feugiat, nunc augue
                blandit nunc, eu sollicitudin urna dolor sagittis lacus. Donec
                elit libero, sodales nec, volutpat a, suscipit non, turpis.
                Nullam sagittis. Suspendisse potenti. Sed lectus. Integer
                euismod lacus luctus magna. Quisque cursus, metus vitae pharetra
                auctor, sem massa mattis sem, at interdum magna augue eget diam.
                Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
                posuere cubilia Curae; Morbi lacinia molestie dui. Praesent
                blandit dolor.
              </p>

              <p>
                (This is filler text intended to create enough content to test
                the scrollable area. Repeat as needed.)
              </p>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  )
}

export default function Page() {
  const isMobile = useIsMobile()
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)

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
            <div className="flex h-14 items-center justify-between px-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <div className={`flex gap-2 ${isMobile && "hidden"}`}>
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
                  {/* 
                  <Button
                    variant={"outline"}
                    onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
                    size={"sm"}
                  >
                    <SparklesIcon data-icon="inline-start" />
                    {isAiSidebarOpen ? "Hide AI" : "Open AI"}
                  </Button> */}
                </div>

                <NotificationsPopover />

                <Show when="signed-out">
                  <SignInButton>
                    <Button variant={"outline"} size={"sm"}>
                      Sign in
                    </Button>
                  </SignInButton>
                  <SignUpButton>
                    <Button size={"sm"}>Sign up</Button>
                  </SignUpButton>
                </Show>

                <Show when="signed-in">
                  <UserButton />
                </Show>
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
