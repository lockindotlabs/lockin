"use client"

import * as React from "react"

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
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  SearchIcon,
  HomeIcon,
  CalendarIcon,
  Settings2Icon,
  PlusIcon,
  Circle,
  ListCheckIcon,
  MessageCircleIcon,
  XIcon,
  ListFilterIcon,
  GoalIcon,
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
import { NavUserSkeleton } from "./nav-user-skeleton"
import { Button } from "@workspace/ui/components/button"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"

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
  const { plans, isLoaded: arePlansLoaded } = usePlanSummaries()
  const { chats, isLoaded: areChatsLoaded } = useChatSummaries()
  const { state } = useSidebar()

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
      url: "/app/focus",
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

  const [open, setOpen] = React.useState(false)

  return (
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
          <SidebarMenuButton onClick={() => setOpen(!open)}>
            <SearchIcon data-icon="inline-start" />
            Search
          </SidebarMenuButton>
          <CommandDialog open={open} onOpenChange={setOpen}>
            <Command>
              <CommandInput
                placeholder="Type a command or search..."
                sideButtons={
                  <Button variant="ghost" size="icon-sm">
                    <ListFilterIcon />
                    <span className="sr-only">Filter</span>
                  </Button>
                }
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup className="mt-1">
                  <div className="flex gap-2">
                    <Button variant={"ghost"} size={"sm"}>
                      <MessageCircleIcon />
                      Chats
                    </Button>
                    <Button variant={"ghost"} size={"sm"}>
                      <ListCheckIcon />
                      Plan
                    </Button>
                  </div>
                </CommandGroup>
                <CommandGroup heading="Recommended">
                  <CommandItem>Calendar1</CommandItem>
                </CommandGroup>
                <CommandGroup heading="Recent">
                  <CommandItem>Calendar</CommandItem>
                  <CommandItem>Search Emoji</CommandItem>
                  <CommandItem>Calculator</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
            <div className="px-3 py-2 text-xs text-muted-foreground">
              <p className="text-xs text-muted-foreground">
                Use <Kbd>Ctrl + K</Kbd> to open the command palette
              </p>
            </div>
          </CommandDialog>
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
        <Button size={"sm"} variant="outline" className="w-full">
          <span>Upgrade</span>
        </Button>
        <React.Suspense fallback={<NavUserSkeleton />}>
          <NavUser />
        </React.Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
