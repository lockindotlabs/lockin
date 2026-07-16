"use client"

import * as React from "react"
import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import { NavUser } from "./nav-user"
import { usePathname } from "next/navigation"
import { useHeaderContext } from "@/components/header-context"

import { NotificationPopover } from "./notification-popover"
import { useTranslation } from "react-i18next"

export default function GlobalHeader() {
  const { state } = useSidebar()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [isTitleBouncing, setIsTitleBouncing] = React.useState(false)
  const titleBounceFrameRef = React.useRef<number | null>(null)

  const { setLeftContainer, setRightContainer, hasLeftContent, visible } =
    useHeaderContext()

  React.useEffect(() => {
    return () => {
      if (titleBounceFrameRef.current !== null) {
        window.cancelAnimationFrame(titleBounceFrameRef.current)
      }
    }
  }, [])

  const triggerTitleBounce = React.useCallback(() => {
    if (titleBounceFrameRef.current !== null) {
      window.cancelAnimationFrame(titleBounceFrameRef.current)
    }

    setIsTitleBouncing(false)
    titleBounceFrameRef.current = window.requestAnimationFrame(() => {
      setIsTitleBouncing(true)
      titleBounceFrameRef.current = null
    })
  }, [])

  const defaultTitle = React.useMemo(() => {
    if (!pathname) return null

    if (pathname.startsWith("/app/ask")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{t("app.nav.askAi", { defaultValue: "Ask AI" })}</span>
        </div>
      )
    }

    if (pathname.startsWith("/app/plans")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{t("app.nav.plans", { defaultValue: "Plans" })}</span>
        </div>
      )
    }

    if (pathname.startsWith("/app/focus")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{t("app.nav.focus", { defaultValue: "Focus" })}</span>
        </div>
      )
    }

    if (pathname.startsWith("/app/settings")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{t("app.nav.settings", { defaultValue: "Settings" })}</span>
        </div>
      )
    }

    if (pathname.startsWith("/app/subscription")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>
            {t("app.nav.subscription", { defaultValue: "Subscription" })}
          </span>
        </div>
      )
    }

    if (pathname.startsWith("/app/admin")) {
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{t("app.nav.admin", { defaultValue: "Admin" })}</span>
        </div>
      )
    }

    // Default to Ask
    return (
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{t("app.nav.home", { defaultValue: "Home" })}</span>
      </div>
    )
  }, [pathname, t])

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
          <div
            className={`flex items-center ${
              isTitleBouncing
                ? "animate-in duration-200 fill-mode-both fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
                : ""
            }`}
            onClick={triggerTitleBounce}
            onAnimationEnd={() => setIsTitleBouncing(false)}
          >
            {/* Left portal container */}
            <div ref={setLeftContainer} className="flex items-center" />

            {/* Fallback default content */}
            {!hasLeftContent && defaultTitle}
          </div>
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
