"use client"

import * as React from "react"

import { NavFavorites } from "@/components/nav-favorites"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import {
  SearchIcon,
  SparklesIcon,
  HomeIcon,
  CalendarIcon,
  Settings2Icon,
  PlusIcon,
} from "lucide-react"
import { LogoWordmark } from "@workspace/ui/components/logo-wordmark"
import { clearChatMessages } from "@/lib/chat/local-chat-persistence"
import { useChatSummaries } from "@/lib/chat/use-chat-summaries"
import { deletePlan } from "@/lib/plans/plan-repository"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { buildAskHref } from "@/lib/routing/ask-url"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { FavoriteItem } from "@/components/nav-favorites"
import { LogoAccent } from "@workspace/ui/components/logo-accent"

type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
}

const navSecondary = [
  {
    title: "Calendar",
    url: "#",
    icon: <CalendarIcon />,
  },
  {
    title: "Settings",
    url: "#",
    icon: <Settings2Icon />,
  },
]

function getPlanIdFromPath(pathname: string) {
  const match = pathname.match(/^\/app\/plan\/(.+)$/)

  return match?.[1] ?? null
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { plans } = usePlanSummaries()
  const { chats } = useChatSummaries()
  const { state } = useSidebar()

  const currentChatId = searchParams.get("id") ?? searchParams.get("t")
  const currentPlanId = searchParams.get("p") ?? searchParams.get("id")
  const pathnamePlanId = getPlanIdFromPath(pathname)

  const navMain: NavItem[] = [
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
    {
      title: "Home",
      url: "/app",
      icon: <HomeIcon />,
      isActive: pathname === "/app",
    },
    {
      title: "Ask AI",
      url: buildAskHref(),
      icon: <SparklesIcon />,
      isActive: pathname === "/app/ask",
    },
    {
      title: "New plan",
      url: "/app/plan",
      icon: <PlusIcon />,
      isActive: pathname === "/app/plan" || pathname.startsWith("/app/plan/"),
    },
  ]

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
    url: `/app/plan?id=${plan.id}`,
    isActive:
      (pathname === "/app/ask" && currentPlanId === plan.id) ||
      (pathname === "/app/plan" && currentPlanId === plan.id) ||
      pathnamePlanId === plan.id,
  }))

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

  const handleDeleteChat = (item: FavoriteItem) => {
    const shouldDelete = window.confirm(`Delete "${item.name}"?`)
    if (!shouldDelete) {
      return
    }

    clearChatMessages(`ask:${item.id}`)

    if (pathname === "/app/ask" && searchParams.get("id") === item.id) {
      router.replace(buildAskHref())
    }
  }

  return (
    <Sidebar
      className="border-r-0 font-medium"
      {...props}
      collapsible="offcanvas"
    >
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 py-1 pr-1">
          <LogoAccent className="h-8" />
          <SidebarTrigger
            className={`${state == "collapsed" && "pointer-events-none opacity-0"} transition-opacity`}
          />
        </div>
        <NavMain items={navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites
          label="Recent chats"
          emptyLabel="No recent chats yet"
          favorites={recentChats}
          onDelete={handleDeleteChat}
        />
        <NavFavorites
          label="Recent plans"
          emptyLabel="No saved plans yet"
          favorites={recentPlans}
          onDelete={handleDeletePlan}
        />
        {/* <NavSecondary items={navSecondary} className="mt-auto" / */}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
