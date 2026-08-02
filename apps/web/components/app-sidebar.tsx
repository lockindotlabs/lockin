"use client"
import * as React from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
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
import { useChatSummaries } from "@/lib/chat/use-chat-summaries"
import { deletePlan } from "@/lib/plans/plan-repository"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { buildAskHref } from "@/lib/routing/ask-url"
import { buildPlanHref } from "@/lib/routing/plan-url"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { RocketIcon } from "lucide-react"
import type { FavoriteItem } from "@/components/nav-favorites"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import { Button } from "@workspace/ui/components/button"
import { useAdminAccess } from "@/lib/admin/use-admin-access"
import {
  Asterisk01,
  BarChart07,
  BookOpen02,
  Home02,
  LineChartUp03,
  List,
  Plus,
  Target05,
} from "@untitledui/icons"
import { FeedbackPopover } from "./feedback-popover"
import { GettingStartedGuide } from "./getting-started-guide"
import { AppLanguageSwitcher } from "./app-language-switcher"
import { TryExtensionPopover } from "./try-extension-popover"

type NavItem = AppSidebarSearchNavItem

function getPlanIdFromPath(pathname: string) {
  const match = pathname.match(/^\/app\/plan\/(.+)$/)

  return match?.[1] ?? null
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { t } = useTranslation()

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

  const currentPlanId = searchParams.get("p") ?? searchParams.get("id")
  const pathnamePlanId = getPlanIdFromPath(pathname)

  const navMain: NavItem[] = [
    {
      title: t("app.nav.home", { defaultValue: "Home" }),
      url: "/app",
      icon: <Home02 />,
      isActive: pathname === "/app",
    },
    {
      title: t("app.nav.plans", { defaultValue: "Plans" }),
      url: "/app/plans",
      icon: <List />,
      isActive: pathname === "/app/plans",
    },
    {
      title: t("app.nav.focus", { defaultValue: "Focus" }),
      url: activeSessionId
        ? `/app/focus/session/${activeSessionId}`
        : "/app/focus",
      icon: <Target05 />,
      isActive: pathname.startsWith("/app/focus"),
    },
    {
      title: t("app.nav.askAi", { defaultValue: "Ask AI" }),
      url: buildAskHref(),
      icon: <Asterisk01 />,
      isActive: pathname === "/app/ask",
    },
    {
      title: t("app.nav.templates", { defaultValue: "Templates" }),
      url: "/app/templates",
      icon: <BookOpen02 />,
      isActive: pathname === "/app/templates",
    },
    {
      title: t("app.nav.roadmap", { defaultValue: "Roadmap" }),
      url: "/app/roadmap",
      icon: <RocketIcon />,
      isActive: pathname.startsWith("/app/roadmap"),
    },
    {
      title: t("app.nav.insights", { defaultValue: "Insights" }),
      url: "/app/insights",
      icon: <LineChartUp03 />,
      isActive: pathname.startsWith("/app/insights"),
    },
  ]

  if (isAdmin) {
    navMain.push({
      title: t("app.nav.admin", { defaultValue: "Admin" }),
      url: "/app/admin/overview",
      icon: <BarChart07 />,
      isActive: pathname.startsWith("/app/admin"),
    })
  }

  const recentPlans: FavoriteItem[] = plans.slice(0, 10).map((plan) => ({
    id: plan.id,
    name:
      plan.title.trim() ||
      t("app.plan.untitled", { defaultValue: "Untitled Plan" }),
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
    const shouldDelete = window.confirm(
      t("app.confirm.delete", {
        name: item.name,
        defaultValue: `Delete "${item.name}"?`,
      })
    )
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
              <span>
                {t("app.actions.newPlan", { defaultValue: "New Plan" })}
              </span>
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
            label={t("app.sidebar.recentPlans", {
              defaultValue: "Recent plans",
            })}
            emptyLabel={t("app.sidebar.noSavedPlans", {
              defaultValue: "No saved plans yet",
            })}
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
              <TryExtensionPopover />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <AppLanguageSwitcher />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <FeedbackPopover />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  toast(
                    t("app.status.comingSoon", { defaultValue: "Coming soon" })
                  )
                }}
              >
                <BookOpen02 data-icon="inline-start" />
                {t("app.nav.knowledgeHub", { defaultValue: "Knowledge Hub" })}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
