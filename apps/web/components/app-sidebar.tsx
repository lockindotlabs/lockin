"use client"
import * as React from "react"
import { toast } from "sonner"
import {
  AppSidebarSearchCommand,
  type AppSidebarSearchNavItem,
} from "@/components/app-sidebar-search-command"
import { NavFavorites } from "@/components/nav-favorites"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { deleteDbChat } from "@/lib/chat/db-chat-client"
import { useChatSummaries } from "@/lib/chat/use-chat-summaries"
import { deletePlan } from "@/lib/plans/plan-repository"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { buildAskHref } from "@/lib/routing/ask-url"
import { buildPlanHref } from "@/lib/routing/plan-url"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { FavoriteItem } from "@/components/nav-favorites"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import { Button } from "@workspace/ui/components/button"
import { useAdminAccess } from "@/lib/admin/use-admin-access"
import {
  Asterisk01,
  BarChart07,
  BookOpen02,
  Home02,
  List,
  MessageChatSquare,
  Plus,
  SearchMd,
  Target05,
} from "@untitledui/icons"
import { FeedbackPopover } from "./feedback-popover"
import PixelCard from "@/components/PixelCard"
import { Kbd } from "@workspace/ui/components/kbd"
import { GettingStartedGuide } from "./getting-started-guide"

type NavItem = AppSidebarSearchNavItem

function getPlanIdFromPath(pathname: string) {
  const match = pathname.match(/^\/app\/plan\/(.+)$/)

  return match?.[1] ?? null
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { plans, isLoaded: arePlansLoaded } = usePlanSummaries()
  const { chats, isLoaded: areChatsLoaded } = useChatSummaries()
  const { state } = useSidebar()
  const { isAdmin } = useAdminAccess()

  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lockin:active_session_id")
      setActiveSessionId(stored)
    }
  }, [pathname])

  const currentChatId = searchParams.get("id") ?? searchParams.get("t")
  const currentPlanId = searchParams.get("p") ?? searchParams.get("id")
  const pathnamePlanId = getPlanIdFromPath(pathname)

  const navMain: NavItem[] = [
    {
      title: "Home",
      url: "/app",
      icon: <Home02 />,
      isActive: pathname === "/app",
    },
    {
      title: "Plans",
      url: "/app/plans",
      icon: <List />,
      isActive: pathname === "/app/plans",
    },
    {
      title: "Focus",
      url: activeSessionId
        ? `/app/focus/session/${activeSessionId}`
        : "/app/focus",
      icon: <Target05 />,
      isActive: pathname.startsWith("/app/focus"),
    },
    {
      title: "Ask AI",
      url: buildAskHref(),
      icon: <Asterisk01 />,
      isActive: pathname === "/app/ask",
    },
  ]

  if (isAdmin) {
    navMain.push({
      title: "Admin",
      url: "/app/admin/overview",
      icon: <BarChart07 />,
      isActive: pathname.startsWith("/app/admin"),
    })
  }

  const recentChats: FavoriteItem[] = chats.slice(0, 10).map((chat) => ({
    id: chat.id,
    name: chat.title,
    url: buildAskHref({ chatSessionId: chat.id }),
    isActive:
      pathname === "/app/ask" &&
      (currentChatId === chat.id || currentPlanId === chat.id),
  }))

  const recentPlans: FavoriteItem[] = plans.slice(0, 10).map((plan) => ({
    id: plan.id,
    name: plan.title.trim() || "Untitled Plan",
    url: buildPlanHref({ planId: plan.id }),
    isActive:
      (pathname === "/app/ask" && currentPlanId === plan.id) ||
      (pathname === "/app/plan" && currentPlanId === plan.id) ||
      pathnamePlanId === plan.id,
  }))

  const handleCreatePlan = () => {
    router.push(buildPlanHref())
  }

  const handleDeletePlan = async (item: FavoriteItem) => {
    const shouldDelete = window.confirm(`Delete "${item.name}"?`)
    if (!shouldDelete) {
      return
    }

    await deletePlan(item.id)

    if (
      pathname === item.url ||
      (pathname === "/app/ask" && searchParams.get("p") === item.id) ||
      (pathname === "/app/plan" && searchParams.get("id") === item.id) ||
      pathname === `/app/plan/${item.id}`
    ) {
      router.replace(buildAskHref())
    }
  }

  const handleDeleteChat = async (item: FavoriteItem) => {
    const shouldDelete = window.confirm(`Delete "${item.name}"?`)
    if (!shouldDelete) {
      return
    }

    await deleteDbChat(item.id)

    if (pathname === "/app/ask" && searchParams.get("id") === item.id) {
      router.replace(buildAskHref())
    }
  }

  return (
    <>
      <Sidebar
        className="z-20 border-r-0 px-1 py-1 pt-1.5 font-medium"
        {...props}
        collapsible="offcanvas"
      >
        <div className="mb-0.5 flex h-12 items-center justify-between gap-2 px-2">
          <LogoAccent
            className="h-7.5 cursor-pointer"
            onClick={() => {
              router.push("/app")
            }}
          />

          <SidebarTrigger
            className={`${state === "collapsed" ? "pointer-events-none opacity-0" : ""} transition-opacity`}
          />
        </div>
        <SidebarHeader className="pt-0">
          <SidebarMenuItem className="flex flex-row gap-1">
            <Button
              variant={"outline"}
              className="flex-1 justify-start border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleCreatePlan}
              size={"sm"}
            >
              <Plus data-icon="inline-start" />
              <span>New Plan</span>
            </Button>

            <AppSidebarSearchCommand
              navItems={navMain}
              chats={chats}
              areChatsLoaded={areChatsLoaded}
              plans={plans}
              arePlansLoaded={arePlansLoaded}
              onCreatePlan={handleCreatePlan}
            />
          </SidebarMenuItem>
          <SidebarMenu>
            <NavMain items={navMain} />
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* <NavFavorites
            label="Recent chats"
            emptyLabel="No recent chats yet"
            favorites={recentChats}
            isLoading={!areChatsLoaded}
            onDelete={handleDeleteChat}
          /> */}
          <NavFavorites
            label="Recent plans"
            emptyLabel="No saved plans yet"
            favorites={recentPlans}
            isLoading={!arePlansLoaded}
            onDelete={handleDeletePlan}
          />
          {/* <NavSecondary items={navSecondary} className="mt-auto" / */}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <GettingStartedGuide />
            <SidebarMenuItem>
              <FeedbackPopover />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  toast("Coming soon")
                }}
              >
                <BookOpen02 data-icon="inline-start" />
                Knowledge Hub
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
