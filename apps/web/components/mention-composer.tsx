"use client"

import {
  ComposerPrimitive,
  useAui,
  useAuiEvent,
  useMessagePartText,
  unstable_useMentionAdapter,
  unstable_useTriggerPopoverScopeContext,
  type ModelContext,
  type Unstable_Mention,
  type Unstable_MentionCategory,
  type Unstable_UseMentionAdapterOptions,
} from "@assistant-ui/react"
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  FileTextIcon,
  ListTodoIcon,
  MessageSquareTextIcon,
  XIcon,
} from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"

import type { MentionRef, MentionType } from "@/lib/mentions/mention-types"
import { getMentionKey, isMentionType } from "@/lib/mentions/mention-types"
import { useChatSummaries } from "@/lib/chat/use-chat-summaries"
import {
  listPlans,
  subscribeToPlanChanges,
  type PlanSummary,
} from "@/lib/plans/plan-repository"
import { cn } from "@workspace/ui/lib/utils"

type MentionComposerRootProps = {
  mentions: MentionRef[]
  resetMentions?: MentionRef[]
  setMentions: Dispatch<SetStateAction<MentionRef[]>>
  children: ReactNode
}

type MentionTriggerPopoverProps = {
  mentions: MentionRef[]
  setMentions: Dispatch<SetStateAction<MentionRef[]>>
}

const DATE_MENTIONS: MentionRef[] = [
  { type: "date", id: "today", label: "Today" },
  { type: "date", id: "tomorrow", label: "Tomorrow" },
  { type: "date", id: "yesterday", label: "Yesterday" },
  { type: "date", id: "this-week", label: "This week" },
]

const mentionFormatter: NonNullable<
  Unstable_UseMentionAdapterOptions["formatter"]
> = {
  serialize: (item) => `@[${sanitizeMentionLabel(item.label)}]`,
  parse: (text) => {
    const segments: Array<
      ReturnType<
        NonNullable<Unstable_UseMentionAdapterOptions["formatter"]>["parse"]
      >[number]
    > = []
    const pattern = /@\[([^\]]+)\]/g
    let lastIndex = 0

    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0
      const label = match[1] ?? ""

      if (index > lastIndex) {
        segments.push({ kind: "text", text: text.slice(lastIndex, index) })
      }

      segments.push({
        kind: "mention",
        type: "mention",
        label,
        id: label,
      })
      lastIndex = index + match[0].length
    }

    if (lastIndex < text.length) {
      segments.push({ kind: "text", text: text.slice(lastIndex) })
    }

    return segments
  },
}

function sanitizeMentionLabel(label: string) {
  return label.replace(/\]/g, "").trim()
}

function getCurrentPlanId(pathname: string, searchParams: URLSearchParams) {
  if (pathname === "/app/plan") {
    return searchParams.get("id")
  }

  return searchParams.get("p")
}

function getCurrentChatId(pathname: string, searchParams: URLSearchParams) {
  if (pathname !== "/app/ask") {
    return null
  }

  return (
    searchParams.get("id") ??
    searchParams.get("t") ??
    searchParams.get("chatSessionId")
  )
}

function toMentionCategoryItem(
  mention: MentionRef,
  description: string,
  icon: string
): Unstable_Mention {
  return {
    id: mention.id,
    type: mention.type,
    label: mention.label,
    description,
    icon,
  }
}

function getMentionRefFromItem(item: {
  type: string
  id: string
  label: string
}) {
  if (!isMentionType(item.type)) {
    return null
  }

  return {
    type: item.type,
    id: item.id,
    label: item.label,
  } satisfies MentionRef
}

function usePlanSummaries() {
  const [plans, setPlans] = useState<PlanSummary[]>([])

  useEffect(() => {
    let isActive = true

    const loadPlans = () => {
      listPlans()
        .then((nextPlans) => {
          if (isActive) {
            setPlans(nextPlans)
          }
        })
        .catch(() => {
          if (isActive) {
            setPlans([])
          }
        })
    }

    loadPlans()
    const unsubscribe = subscribeToPlanChanges(loadPlans)

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  return plans
}

function useMentionCategories() {
  const pathname = usePathname()
  const readonlySearchParams = useSearchParams()
  const searchParams = useMemo(
    () => new URLSearchParams(readonlySearchParams.toString()),
    [readonlySearchParams]
  )
  const plans = usePlanSummaries()
  const { chats } = useChatSummaries()

  return useMemo<Unstable_MentionCategory[]>(() => {
    const currentPlanId = getCurrentPlanId(pathname, searchParams)
    const currentChatId = getCurrentChatId(pathname, searchParams)
    const currentItems: Unstable_Mention[] = []

    if (currentChatId) {
      currentItems.push(
        toMentionCategoryItem(
          {
            type: "current-thread",
            id: "current",
            label: "Current thread",
          },
          "Use the current chat thread",
          "thread"
        )
      )
    }

    if (currentPlanId) {
      const currentPlan = plans.find((plan) => plan.id === currentPlanId)
      currentItems.push(
        toMentionCategoryItem(
          {
            type: "current-plan",
            id: currentPlanId,
            label: currentPlan?.title || "Current plan",
          },
          "Use the currently open plan",
          "current-plan"
        )
      )
    }

    const categories: Unstable_MentionCategory[] = []

    if (currentItems.length > 0) {
      categories.push({
        id: "current",
        label: "Current context",
        items: currentItems,
      })
    }

    if (plans.length > 0) {
      categories.push({
        id: "plans",
        label: "Plans",
        items: plans.map((plan) =>
          toMentionCategoryItem(
            {
              type: "plan",
              id: plan.id,
              label: plan.title || "Untitled plan",
            },
            `${plan.taskCount} steps`,
            "plan"
          )
        ),
      })
    }

    if (chats.length > 0) {
      categories.push({
        id: "chats",
        label: "Recent chats",
        items: chats.map((chat) =>
          toMentionCategoryItem(
            {
              type: "chat",
              id: chat.id,
              label: chat.title || "New chat",
            },
            `${chat.messageCount} messages`,
            "chat"
          )
        ),
      })
    }

    categories.push({
      id: "dates",
      label: "Dates",
      items: DATE_MENTIONS.map((mention) =>
        toMentionCategoryItem(mention, "Use this date as context", "date")
      ),
    })

    return categories
  }, [chats, pathname, plans, searchParams])
}

function MentionConfigRegistrar({ mentions }: { mentions: MentionRef[] }) {
  const api = useAui()

  useEffect(() => {
    const context = mentions.length > 0 ? { config: { mentions } } : {}

    return api.modelContext().register({
      getModelContext: () => context as ModelContext,
    })
  }, [api, mentions])

  return null
}

function MentionAutoClear({
  resetMentions = [],
  setMentions,
}: {
  resetMentions?: MentionRef[]
  setMentions: Dispatch<SetStateAction<MentionRef[]>>
}) {
  useAuiEvent("thread.runStart", () => {
    window.setTimeout(() => setMentions(resetMentions), 0)
  })

  return null
}

function MentionTriggerPopover({
  mentions,
  setMentions,
}: MentionTriggerPopoverProps) {
  const categories = useMentionCategories()
  const selectedKeys = useMemo(
    () => new Set(mentions.map(getMentionKey)),
    [mentions]
  )
  const mention = unstable_useMentionAdapter({
    categories,
    includeModelContextTools: false,
    formatter: mentionFormatter,
    onInserted: (item) => {
      const mentionRef = getMentionRefFromItem(item)

      if (!mentionRef) {
        return
      }

      setMentions((currentMentions) => {
        const key = getMentionKey(mentionRef)

        return currentMentions.some(
          (currentMention) => getMentionKey(currentMention) === key
        )
          ? currentMentions
          : [...currentMentions, mentionRef]
      })
    },
  })

  return (
    <ComposerPrimitive.Unstable_TriggerPopover
      char="@"
      adapter={mention.adapter}
      aria-label="Mention suggestions"
      className={
        "absolute right-0 bottom-[calc(100%+0.5rem)] left-0 z-50 max-h-80 origin-(--transform-origin) overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg outline-hidden duration-100" +
        "data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 " +
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 " +
        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
      }
    >
      <ComposerPrimitive.Unstable_TriggerPopover.Directive
        formatter={mention.directive.formatter}
        onInserted={mention.directive.onInserted}
      />
      <MentionPopoverContent selectedKeys={selectedKeys} />
    </ComposerPrimitive.Unstable_TriggerPopover>
  )
}

function MentionPopoverContent({
  selectedKeys,
}: {
  selectedKeys: Set<string>
}) {
  const { query, activeCategoryId, items, isSearchMode } =
    unstable_useTriggerPopoverScopeContext()

  return (
    <div className="grid max-h-80 overflow-y-auto p-1">
      <ComposerPrimitive.Unstable_TriggerPopoverBack className="mb-1 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
        <ChevronLeftIcon className="size-4" />
        Back
      </ComposerPrimitive.Unstable_TriggerPopoverBack>
      <ComposerPrimitive.Unstable_TriggerPopoverCategories>
        {(categories) =>
          categories.map((category) => (
            <ComposerPrimitive.Unstable_TriggerPopoverCategoryItem
              key={category.id}
              categoryId={category.id}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
            >
              <MentionIcon type={category.id} />
              <span className="min-w-0 flex-1 truncate">{category.label}</span>
            </ComposerPrimitive.Unstable_TriggerPopoverCategoryItem>
          ))
        }
      </ComposerPrimitive.Unstable_TriggerPopoverCategories>
      <ComposerPrimitive.Unstable_TriggerPopoverItems>
        {(mentionItems) =>
          mentionItems.length > 0 ? (
            mentionItems.map((item, index) => {
              const mentionRef = getMentionRefFromItem(item)
              const selected = mentionRef
                ? selectedKeys.has(getMentionKey(mentionRef))
                : false

              return (
                <ComposerPrimitive.Unstable_TriggerPopoverItem
                  key={`${item.type}:${item.id}`}
                  item={item}
                  index={index}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                >
                  <MentionIcon type={item.type} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Added
                    </span>
                  ) : null}
                </ComposerPrimitive.Unstable_TriggerPopoverItem>
              )
            })
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches
            </div>
          )
        }
      </ComposerPrimitive.Unstable_TriggerPopoverItems>
      {!activeCategoryId && !isSearchMode && query ? (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          No matches
        </div>
      ) : null}
      {(activeCategoryId || isSearchMode) && items.length === 0 ? null : null}
    </div>
  )
}

function MentionIcon({ type }: { type: string }) {
  const className = "size-4"

  if (type === "chat" || type === "thread" || type === "current-thread") {
    return <MessageSquareTextIcon className={className} />
  }

  if (type === "date" || type === "dates") {
    return <CalendarDaysIcon className={className} />
  }

  if (type === "plan" || type === "plans" || type === "current-plan") {
    return <ListTodoIcon className={className} />
  }

  return <FileTextIcon className={className} />
}

export function MentionChips({
  mentions,
  onRemove,
}: {
  mentions: MentionRef[]
  onRemove: (mention: MentionRef) => void
}) {
  if (mentions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1.5 px-1">
      {mentions.map((mention) => (
        <span
          key={getMentionKey(mention)}
          className="inline-flex max-w-40 items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
        >
          <MentionIcon type={mention.type} />
          <span className="truncate text-foreground">{mention.label}</span>
          <button
            type="button"
            className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={`Remove ${mention.label}`}
            onClick={() => onRemove(mention)}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
    </div>
  )
}

export function MentionComposerRoot({
  mentions,
  resetMentions,
  setMentions,
  children,
}: MentionComposerRootProps) {
  return (
    <ComposerPrimitive.Unstable_TriggerPopoverRoot>
      <div className="relative">
        <MentionConfigRegistrar mentions={mentions} />
        <MentionAutoClear
          resetMentions={resetMentions}
          setMentions={setMentions}
        />
        <MentionTriggerPopover mentions={mentions} setMentions={setMentions} />
        {children}
      </div>
    </ComposerPrimitive.Unstable_TriggerPopoverRoot>
  )
}

export function MentionTextPart() {
  const { text } = useMessagePartText()

  return <p className="whitespace-pre-line">{renderMentionText(text)}</p>
}

function renderMentionText(text: string) {
  const parts: ReactNode[] = []
  const pattern = /@\[([^\]]+)\]/g
  let lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    const label = match[1] ?? ""

    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }

    parts.push(
      <span
        key={`${index}:${label}`}
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 align-baseline text-primary"
        )}
      >
        <FileTextIcon className="size-3" />
        {label}
      </span>
    )
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}
