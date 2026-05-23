"use client"

import * as React from "react"

import { NavFavorites } from "@/components/nav-favorites"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavWorkspaces } from "@/components/nav-workspaces"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
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
import { deletePlan } from "@/lib/plans/plan-repository"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { usePathname, useRouter } from "next/navigation"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },

    {
      title: "Home",
      url: "/app",
      icon: <HomeIcon />,
      isActive: true,
    },
    {
      title: "Ask AI",
      url: "#",
      icon: <SparklesIcon />,
    },
    {
      title: "New plan",
      url: "/app/plan",
      icon: <PlusIcon />,
    },
  ],
  navSecondary: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const { plans } = usePlanSummaries()

  const recentPlans = plans.slice(0, 10).map((plan) => ({
    id: plan.id,
    name: plan.title.trim() || "Untitled Plan",
    url: `/app/plan/${plan.id}`,
  }))

  const handleDeletePlan = async (item: (typeof recentPlans)[number]) => {
    const shouldDelete = window.confirm(`Delete "${item.name}"?`)
    if (!shouldDelete) {
      return
    }

    await deletePlan(item.id)

    if (pathname === item.url) {
      router.replace("/app")
    }
  }

  return (
    <Sidebar className="border-r-0 font-medium" {...props} collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-1">
          <LogoWordmark className="h-6" />
        </div>
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites
          label="Recent plans"
          emptyLabel="No saved plans yet"
          favorites={recentPlans}
          onDelete={handleDeletePlan}
        />
        {/* <NavWorkspaces workspaces={data.workspaces} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
