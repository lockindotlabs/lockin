"use client"

import * as React from "react"
import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { Bell01, List, Coins04, Asterisk02 } from "@untitledui/icons"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import { ChevronDown, CoinsIcon, ArrowRight, GoalIcon } from "lucide-react"
import { NavUser } from "./nav-user"
import { useAiUsageSummary } from "@/lib/ai/use-ai-usage-summary"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { usePathname } from "next/navigation"
import { useHeaderContext } from "@/components/header-context"
import { useRightSidebarContext } from "@/components/right-sidebar-context"

import { AiPlansPopover } from "./ai-plans-popover"
import { NotificationPopover } from "./notification-popover"
import { CreditsPopover } from "./credits-popover"

export default function GlobalHeader() {
  const { state, stateRight } = useSidebar()
  const { hasContent } = useRightSidebarContext()
  const { summary, isLoaded } = useAiUsageSummary()
  const pathname = usePathname()

  const { setLeftContainer, setRightContainer, hasLeftContent, visible } =
    useHeaderContext()

  const defaultTitle = React.useMemo(() => {
    if (!pathname) return null

    if (pathname.startsWith("/app/ask")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Ask</span>
        </div>
      )
    }

    if (pathname.startsWith("/app/plans")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Plans</span>
        </div>
      )
    }

    if (pathname.startsWith("/app/focus")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Focus</span>
        </div>
      )
    }

    if (pathname.startsWith("/app/settings")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Settings</span>
        </div>
      )
    }

    // Default to Ask
    return (
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>Home</span>
      </div>
    )
  }, [pathname])

  if (!visible) return null

  return (
    <div className="absolute top-0 z-10 flex h-12 w-full items-center justify-between border-b bg-background/80 px-3 backdrop-blur-sm">
      <div className="flex items-center">
        <SidebarTrigger
          className={`${state === "collapsed" ? "" : "pointer-events-none opacity-0"} text-sidebar-foreground transition-opacity`}
        />
        <div
          className={`${state === "collapsed" ? "" : "-translate-x-8"} flex items-center pl-2 transition-all`}
        >
          {/* Left portal container */}
          <div ref={setLeftContainer} className="flex items-center" />

          {/* Fallback default content */}
          {!hasLeftContent && defaultTitle}
        </div>
      </div>

      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>

      <div className="flex items-center gap-2">
        <div ref={setRightContainer} className="flex items-center gap-2" />
        <AiPlansPopover summary={summary} isLoaded={isLoaded} />
        <CreditsPopover summary={summary} isLoaded={isLoaded} />
        <NotificationPopover />
        <NavUser />
      </div>
    </div>
  )
}
