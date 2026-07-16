"use client"

import * as React from "react"
import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import { NavUser } from "./nav-user"
import { usePathname } from "next/navigation"
import { useHeaderContext } from "@/components/header-context"

import { NotificationPopover } from "./notification-popover"

export default function GlobalHeader() {
  const { state } = useSidebar()
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

    if (pathname.startsWith("/app/subscription")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Subscription</span>
        </div>
      )
    }

    if (pathname.startsWith("/app/admin")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Admin</span>
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
          className={`${state === "collapsed" ? "" : "-translate-x-8"} flex items-center pl-2 transition-transform`}
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
        <NotificationPopover />
        <NavUser side="bottom" align="end" sideOffset={16} />
      </div>
    </div>
  )
}
