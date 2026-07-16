"use client"

import * as React from "react"
import {
  ListCheckIcon,
  MessageCircleIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import type { ChatSummary } from "@/lib/chat/local-chat-persistence"
import type { PlanSummary } from "@/lib/plans/plan-repository"
import { buildAskHref } from "@/lib/routing/ask-url"
import { buildPlanHref } from "@/lib/routing/plan-url"
import {
  searchApp,
  type AppSearchResponse,
  type AppSearchType,
} from "@/lib/search/app-search-client"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Kbd } from "@workspace/ui/components/kbd"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"
import { SearchMd } from "@untitledui/icons"

export type AppSidebarSearchNavItem = {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
}

type AppSidebarSearchCommandProps = {
  navItems: AppSidebarSearchNavItem[]
  chats: ChatSummary[]
  areChatsLoaded: boolean
  plans: PlanSummary[]
  arePlansLoaded: boolean
  onCreatePlan: () => void
}

type SearchFilter = AppSearchType

type SearchResultKind = "action" | "chat" | "nav" | "plan"

type BackendSearchState = AppSearchResponse & {
  query: string
  type: SearchFilter
}

type SearchResult = {
  id: string
  kind: SearchResultKind
  title: string
  description: string
  icon: React.ReactNode
  searchText: string
  isActive?: boolean
  url?: string
  action?: () => void
}

const FILTERS: {
  id: SearchFilter
  labelKey: string
  defaultLabel: string
  icon: React.ReactNode
}[] = [
  {
    id: "all",
    labelKey: "app.search.filters.all",
    defaultLabel: "All",
    icon: <SearchIcon data-icon="inline-start" />,
  },
  {
    id: "chats",
    labelKey: "app.search.filters.chats",
    defaultLabel: "Chats",
    icon: <MessageCircleIcon data-icon="inline-start" />,
  },
  {
    id: "plans",
    labelKey: "app.search.filters.plans",
    defaultLabel: "Plans",
    icon: <ListCheckIcon data-icon="inline-start" />,
  },
]

const EMPTY_BACKEND_SEARCH: BackendSearchState = {
  query: "",
  type: "all",
  chats: [],
  plans: [],
}

function getSearchText(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ").toLowerCase()
}

function getTerms(query: string) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

function matchesQuery(result: SearchResult, query: string) {
  const terms = getTerms(query)

  if (terms.length === 0) {
    return true
  }

  return terms.every((term) => result.searchText.includes(term))
}

function matchesFilter(result: SearchResult, filter: SearchFilter) {
  if (filter === "all") {
    return true
  }

  if (filter === "chats") {
    return result.kind === "chat"
  }

  return result.kind === "plan" || result.id === "action:new-plan"
}

function formatCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`
}

function getChatTitle(chat: ChatSummary) {
  return chat.title.trim()
}

function getPlanTitle(plan: PlanSummary) {
  return plan.title.trim()
}

function isQuickAction(result: SearchResult) {
  return result.kind === "action" || result.kind === "nav"
}

function LoadingItem({ label }: { label: string }) {
  return (
    <CommandItem disabled value={label}>
      <span className="text-muted-foreground">{label}</span>
    </CommandItem>
  )
}

export function AppSidebarSearchCommand({
  navItems,
  chats,
  areChatsLoaded,
  plans,
  arePlansLoaded,
  onCreatePlan,
}: AppSidebarSearchCommandProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<SearchFilter>("all")
  const [backendSearch, setBackendSearch] =
    React.useState<BackendSearchState>(EMPTY_BACKEND_SEARCH)
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchError, setSearchError] = React.useState(false)
  const trimmedQuery = query.trim()
  const isBackendSearch = trimmedQuery.length > 0

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setQuery("")
      setFilter("all")
      setIsSearching(false)
      setSearchError(false)
    }
  }, [])

  const handleQueryChange = React.useCallback((nextQuery: string) => {
    setQuery(nextQuery)

    if (!nextQuery.trim()) {
      setIsSearching(false)
      setSearchError(false)
    }
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.key.toLowerCase() !== "k") {
        return
      }

      if (!event.metaKey && !event.ctrlKey) {
        return
      }

      event.preventDefault()
      setOpen((currentOpen) => {
        const nextOpen = !currentOpen

        if (!nextOpen) {
          setQuery("")
          setFilter("all")
          setIsSearching(false)
          setSearchError(false)
        }

        return nextOpen
      })
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  React.useEffect(() => {
    if (!open || !trimmedQuery) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true)
      setSearchError(false)

      searchApp({
        query: trimmedQuery,
        type: filter,
        limit: 10,
        signal: controller.signal,
      })
        .then((nextResults) => {
          if (controller.signal.aborted) {
            return
          }

          setBackendSearch({
            query: trimmedQuery,
            type: filter,
            ...nextResults,
          })
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return
          }

          if (error instanceof DOMException && error.name === "AbortError") {
            return
          }

          setBackendSearch({
            query: trimmedQuery,
            type: filter,
            chats: [],
            plans: [],
          })
          setSearchError(true)
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false)
          }
        })
    }, 200)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [filter, open, trimmedQuery])

  const hasFreshBackendResults =
    backendSearch.query === trimmedQuery && backendSearch.type === filter
  const visibleChats = isBackendSearch
    ? hasFreshBackendResults
      ? backendSearch.chats
      : []
    : chats
  const visiblePlans = isBackendSearch
    ? hasFreshBackendResults
      ? backendSearch.plans
      : []
    : plans

  const results = React.useMemo<SearchResult[]>(() => {
    const actionResults: SearchResult[] = [
      {
        id: "action:new-plan",
        kind: "action",
        title: t("app.actions.newPlan", { defaultValue: "New Plan" }),
        description: t("app.search.createBlankPlan", {
          defaultValue: "Create a blank plan",
        }),
        icon: <PlusIcon />,
        action: onCreatePlan,
        searchText: getSearchText("new plan", "create blank task action"),
      },
    ]

    const navResults = navItems.map<SearchResult>((item) => ({
      id: `nav:${item.url}`,
      kind: "nav",
      title: item.title,
      description: item.isActive
        ? t("app.search.currentPage", { defaultValue: "Current page" })
        : t("app.search.openPage", { defaultValue: "Open page" }),
      icon: item.icon,
      isActive: item.isActive,
      url: item.url,
      searchText: getSearchText(item.title, "navigation page"),
    }))

    const chatResults = visibleChats.map<SearchResult>((chat) => {
      const title =
        getChatTitle(chat) ||
        t("app.chat.newChat", { defaultValue: "New chat" })

      return {
        id: `chat:${chat.id}`,
        kind: "chat",
        title,
        description: t("app.search.messageCount", {
          count: chat.messageCount,
          defaultValue: formatCount(chat.messageCount, "message"),
        }),
        icon: <MessageCircleIcon />,
        url: buildAskHref({ chatSessionId: chat.id }),
        searchText: getSearchText(
          title,
          "chat conversation thread ask ai",
          formatCount(chat.messageCount, "message")
        ),
      }
    })

    const planResults = visiblePlans.map<SearchResult>((plan) => {
      const title =
        getPlanTitle(plan) ||
        t("app.plan.untitled", { defaultValue: "Untitled Plan" })

      return {
        id: `plan:${plan.id}`,
        kind: "plan",
        title,
        description: t("app.search.stepCount", {
          count: plan.taskCount,
          defaultValue: formatCount(plan.taskCount, "step"),
        }),
        icon: <ListCheckIcon />,
        url: buildPlanHref({ planId: plan.id }),
        searchText: getSearchText(
          title,
          "plan tasks steps",
          formatCount(plan.taskCount, "step")
        ),
      }
    })

    return [...actionResults, ...navResults, ...chatResults, ...planResults]
  }, [navItems, onCreatePlan, t, visibleChats, visiblePlans])

  const filteredResults = React.useMemo(
    () =>
      results.filter(
        (result) => matchesFilter(result, filter) && matchesQuery(result, query)
      ),
    [filter, query, results]
  )

  const quickResults = filteredResults.filter(isQuickAction)
  const chatResults = filteredResults.filter((result) => result.kind === "chat")
  const planResults = filteredResults.filter((result) => result.kind === "plan")
  const shouldShowChats = filter === "all" || filter === "chats"
  const shouldShowPlans = filter === "all" || filter === "plans"
  const isAwaitingBackendResults =
    isBackendSearch && (!hasFreshBackendResults || isSearching)
  const isLoadingChats =
    shouldShowChats &&
    (isBackendSearch ? isAwaitingBackendResults : !areChatsLoaded)
  const isLoadingPlans =
    shouldShowPlans &&
    (isBackendSearch ? isAwaitingBackendResults : !arePlansLoaded)
  const hasVisibleResults = filteredResults.length > 0
  const emptyLabel =
    searchError && isBackendSearch
      ? t("app.search.unableToSearch", {
          defaultValue: "Unable to search. Try again.",
        })
      : t("app.search.noResults", { defaultValue: "No results found." })

  const handleSelect = (result: SearchResult) => {
    handleOpenChange(false)

    if (result.action) {
      result.action()
      return
    }

    if (result.url) {
      router.push(result.url)
    }
  }

  return (
    <>
      <Button
        variant={"outline"}
        className="border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        size={"sm"}
        onClick={() => handleOpenChange(true)}
      >
        <SearchMd data-icon="inline-start" />
        <Kbd>Ctrl K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={handleQueryChange}
            placeholder={t("app.search.placeholder", {
              defaultValue: "Type a command or search...",
            })}
          />
          <CommandList>
            <CommandGroup className="mt-1">
              <div className="flex gap-1 px-1">
                {FILTERS.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant={filter === item.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(item.id)}
                  >
                    {item.icon}
                    {t(item.labelKey, { defaultValue: item.defaultLabel })}
                  </Button>
                ))}
              </div>
            </CommandGroup>

            {quickResults.length > 0 && (
              <CommandGroup
                heading={t("app.search.quickActions", {
                  defaultValue: "Quick actions",
                })}
              >
                {quickResults.map((result) => (
                  <SearchCommandItem
                    key={result.id}
                    result={result}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            )}

            {(chatResults.length > 0 || isLoadingChats) && (
              <CommandGroup
                heading={t("app.search.chats", { defaultValue: "Chats" })}
              >
                {isLoadingChats ? (
                  <LoadingItem
                    label={t("app.search.loadingChats", {
                      defaultValue: "Loading chats...",
                    })}
                  />
                ) : null}
                {chatResults.map((result) => (
                  <SearchCommandItem
                    key={result.id}
                    result={result}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            )}

            {(planResults.length > 0 || isLoadingPlans) && (
              <CommandGroup
                heading={t("app.search.plans", { defaultValue: "Plans" })}
              >
                {isLoadingPlans ? (
                  <LoadingItem
                    label={t("app.search.loadingPlans", {
                      defaultValue: "Loading plans...",
                    })}
                  />
                ) : null}
                {planResults.map((result) => (
                  <SearchCommandItem
                    key={result.id}
                    result={result}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            )}

            {!hasVisibleResults && !isLoadingChats && !isLoadingPlans ? (
              <CommandEmpty>{emptyLabel}</CommandEmpty>
            ) : null}
          </CommandList>
        </Command>
        <div className="px-3 py-2 text-xs text-muted-foreground">
          <p className="text-xs text-muted-foreground">
            {t("app.search.shortcutPrefix", { defaultValue: "Use" })}{" "}
            <Kbd>Ctrl + K</Kbd>{" "}
            {t("app.search.shortcutSuffix", {
              defaultValue: "to open the command palette",
            })}
          </p>
        </div>
      </CommandDialog>
    </>
  )
}

function SearchCommandItem({
  result,
  onSelect,
}: {
  result: SearchResult
  onSelect: (result: SearchResult) => void
}) {
  return (
    <CommandItem
      value={`${result.id} ${result.searchText}`}
      data-checked={result.isActive ? true : undefined}
      onSelect={() => onSelect(result)}
    >
      {result.icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{result.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {result.description}
        </span>
      </span>
    </CommandItem>
  )
}
