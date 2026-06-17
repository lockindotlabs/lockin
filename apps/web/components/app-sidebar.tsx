"use client"

import * as React from "react"

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
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import {
  HomeIcon,
  PlusIcon,
  ListCheckIcon,
  GoalIcon,
  BarChart3Icon,
} from "lucide-react"
import { deleteDbChat } from "@/lib/chat/db-chat-client"
import { useChatSummaries } from "@/lib/chat/use-chat-summaries"
import { deletePlan } from "@/lib/plans/plan-repository"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { buildAskHref } from "@/lib/routing/ask-url"
import { buildPlanHref } from "@/lib/routing/plan-url"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { FavoriteItem } from "@/components/nav-favorites"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import { AiPlannerIcon } from "./icons"
import { NavUser } from "./nav-user"
import { Button } from "@workspace/ui/components/button"
import { useAdminAccess } from "@/lib/admin/use-admin-access"

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

  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null)

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
      icon: <HomeIcon />,
      isActive: pathname === "/app",
    },
    {
      title: "Plans",
      url: "/app/plans",
      icon: <ListCheckIcon />,
      isActive: pathname === "/app/plans",
    },
    {
      title: "Focus",
      url: activeSessionId ? `/app/focus/session/${activeSessionId}` : "/app/focus",
      icon: <GoalIcon />,
      isActive: pathname.startsWith("/app/focus"),
    },
    {
      title: "Ask AI",
      url: buildAskHref(),
      icon: <AiPlannerIcon />,
      isActive: pathname === "/app/ask",
    },
  ]

  if (isAdmin) {
    navMain.push({
      title: "Admin",
      url: "/app/admin/overview",
      icon: <BarChart3Icon />,
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
      {" "}
      <Sidebar
        className="border-r-0 font-medium"
        {...props}
        collapsible="offcanvas"
      >
        <SidebarHeader>
          <div className="flex items-center justify-between gap-2 pr-1">
            <LogoAccent
              className="h-8 cursor-pointer"
              onClick={() => {
                router.push("/app")
              }}
            />
            <SidebarTrigger
              className={`${state == "collapsed" && "pointer-events-none opacity-0"} transition-opacity`}
            />
          </div>
          <SidebarMenuItem>
            <Button
              variant={"outline"}
              className="w-full border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleCreatePlan}
            >
              <PlusIcon data-icon="inline-start" />
              New Plan
            </Button>
          </SidebarMenuItem>
          <SidebarMenu>
            <AppSidebarSearchCommand
              navItems={navMain}
              chats={chats}
              areChatsLoaded={areChatsLoaded}
              plans={plans}
              arePlansLoaded={arePlansLoaded}
              onCreatePlan={handleCreatePlan}
            />
            <NavMain items={navMain} />
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavFavorites
            label="Recent chats"
            emptyLabel="No recent chats yet"
            favorites={recentChats}
            isLoading={!areChatsLoaded}
            onDelete={handleDeleteChat}
          />
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
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
