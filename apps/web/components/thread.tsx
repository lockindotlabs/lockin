import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/attachment"
import { MarkdownText } from "@/components/markdown-text"
import {
  MentionChips,
  MentionComposerRoot,
  MentionTextPart,
} from "@/components/mention-composer"
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "@/components/reasoning"
import {
  ToolGroupContent,
  ToolGroupRoot,
  ToolGroupTrigger,
} from "@/components/tool-group"
import { ToolFallback } from "@/components/tool-fallback"
import { TooltipIconButton } from "@/components/tooltip-icon-button"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  getMcpAppFromToolPart,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadPrimitive,
  type ToolCallMessagePartComponent,
  type ToolCallMessagePartProps,
  useAuiState,
} from "@assistant-ui/react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  GlobeIcon,
  InboxIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  SparkleIcon,
  SquareIcon,
} from "lucide-react"
import { useEffect, useMemo, useState, type FC } from "react"
import { ModelSelector, type ModelOption } from "./model-selector"
import GeminiLogo from "./logo-gemini"
import { ContextDisplay } from "./context-display"
import { CapabilitiesSelector } from "./capabilities-selector"
import { getMentionKey, type MentionRef } from "@/lib/mentions/mention-types"
import { motion } from "motion/react"
import { AiPlannerIcon } from "./icons"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { useRecentlyOpenedPlans } from "@/lib/plans/recently-opened-plans"
import Link from "next/link"
import { PlanGrid } from "./plan-grid"
import { Asterisk01, ClockRewind, Plus } from "@untitledui/icons"
import { useChatSummaries } from "@/lib/chat/use-chat-summaries"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"
import { buildAskHref } from "@/lib/routing/ask-url"

type ThreadModelOption = ModelOption & {
  contextWindow: number
}

const GEMINI_MODELS = [
  {
    id: "gemini-3.1-flash-lite-preview",
    name: "Fast",
    description: "Efficient for most tasks",
    contextWindow: 1_000_000,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Extended",
    description: "Handles more complex tasks",
    contextWindow: 1_000_000,
  },
] satisfies ThreadModelOption[]

const AI_CAPABILITIES = [
  {
    id: "web-search",
    name: "Web search",
    icon: <GlobeIcon />,
  },
  {
    id: "complex-reasoning",
    name: "Complex reasoning",
    icon: <SparkleIcon />,
  },
]

const DEFAULT_MODEL_ID = "gemini-3.1-flash-lite-preview"
const DEFAULT_MODEL = GEMINI_MODELS[0]!

const ToolsDropdown = () => {
  return <></>
}

export const Thread: FC<{
  mode?: "onboarding" | "plan"
  initialMentions?: MentionRef[]
}> = ({ mode = "onboarding", initialMentions }) => {
  const { plans, isLoaded } = usePlanSummaries()
  const recentlyOpenedPlans = useRecentlyOpenedPlans(plans)
  const homePlans = recentlyOpenedPlans.slice(0, 3)

  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID)
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<
    string | undefined
  >(undefined)
  const isEmpty = useAuiState((s) => s.thread.isEmpty)
  const router = useRouter()

  const { chats } = useChatSummaries()

  const handleChatSelect = (chatId: string) => {
    router.push(buildAskHref({ chatSessionId: chatId }))
  }

  const { todayChats, yesterdayChats, previousSevenDaysChats, olderChats } =
    useMemo(() => {
      const now = new Date()
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime()
      const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
      const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000

      const today: typeof chats = []
      const yesterday: typeof chats = []
      const sevenDays: typeof chats = []
      const older: typeof chats = []

      chats.forEach((chat) => {
        const time = chat.updatedAt ? new Date(chat.updatedAt).getTime() : 0
        if (!time) {
          older.push(chat)
        } else if (time >= todayStart) {
          today.push(chat)
        } else if (time >= yesterdayStart) {
          yesterday.push(chat)
        } else if (time >= sevenDaysAgoStart) {
          sevenDays.push(chat)
        } else {
          older.push(chat)
        }
      })

      return {
        todayChats: today,
        yesterdayChats: yesterday,
        previousSevenDaysChats: sevenDays,
        olderChats: older,
      }
    }, [chats])

  return (
    <>
      <AuiIf condition={(s) => s.thread.isEmpty && mode == "onboarding"}>
        <div className="absolute top-12 right-0 left-0 z-10 flex h-12 items-center border-b bg-background/80 px-3 backdrop-blur">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant={"outline"} size={"sm"} className={"text-xs"}>
                  <ClockRewind data-icon="inline-start" />
                  Recent
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="max-w-100 min-w-64">
              {chats.length === 0 ? (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                    No recent chats
                  </div>
                </>
              ) : (
                <>
                  {todayChats.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Today</DropdownMenuLabel>
                        {todayChats.map((chat) => (
                          <DropdownMenuItem
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.id)}
                            className="truncate"
                          >
                            {chat.title || "New chat"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </>
                  )}

                  {yesterdayChats.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Yesterday</DropdownMenuLabel>
                        {yesterdayChats.map((chat) => (
                          <DropdownMenuItem
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.id)}
                            className="truncate"
                          >
                            {chat.title || "New chat"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </>
                  )}

                  {previousSevenDaysChats.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Previous 7 days</DropdownMenuLabel>
                        {previousSevenDaysChats.map((chat) => (
                          <DropdownMenuItem
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.id)}
                            className="truncate"
                          >
                            {chat.title || "New chat"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </>
                  )}

                  {olderChats.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Older</DropdownMenuLabel>
                        {olderChats.map((chat) => (
                          <DropdownMenuItem
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.id)}
                            className="truncate"
                          >
                            {chat.title || "New chat"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </AuiIf>
      <ThreadPrimitive.Root
        className="aui-root aui-thread-root @container flex max-h-[calc(100vh-1rem)] flex-1 flex-col"
        style={{
          ["--thread-max-width" as string]: "44rem",
          ["--composer-radius" as string]: "var(--radius-2xl)",
          ["--composer-padding" as string]: "10px",
        }}
      >
        <ThreadPrimitive.Viewport
          turnAnchor="bottom"
          autoScroll={true}
          scrollToBottomOnRunStart={true}
          scrollToBottomOnInitialize={false}
          scrollToBottomOnThreadSwitch={true}
          data-slot="aui_thread-viewport"
          className="relative my-auto flex flex-1 flex-col overflow-x-auto overflow-y-auto scroll-smooth"
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2",
              !isEmpty && "flex-1",
              mode === "plan" ? "mt-auto" : "my-auto"
            )}
          >
            <AuiIf condition={(s) => s.thread.isEmpty}>
              {mode === "plan" ? (
                <>
                  <ThreadPlanWelcome />
                  <ThreadSuggestions mode={mode} />
                </>
              ) : (
                <ThreadWelcome />
              )}
            </AuiIf>

            <div
              data-slot="aui_message-group"
              className="mt-12 mb-16 flex flex-col gap-y-8 empty:hidden"
            >
              <ThreadPrimitive.Messages>
                {() => <ThreadMessage />}
              </ThreadPrimitive.Messages>
            </div>

            <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mt-auto flex flex-col gap-4 overflow-visible rounded-t-(--composer-radius) py-2">
              <ThreadScrollToBottom />
              <Composer
                mode={mode}
                initialMentions={initialMentions}
                selectedModelId={selectedModelId}
                onSelectedModelChange={setSelectedModelId}
                selectedCapabilityId={selectedCapabilityId}
                onSelectedCapabilityChange={setSelectedCapabilityId}
              />
            </ThreadPrimitive.ViewportFooter>
            <AuiIf condition={(s) => s.thread.isEmpty}>
              {mode === "onboarding" && <ThreadSuggestions />}
            </AuiIf>
            <AuiIf condition={(s) => s.thread.isEmpty && mode === "onboarding"}>
              {!isLoaded ? (
                <section className="mx-auto w-full max-w-3xl px-4 pt-20">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-40 animate-pulse rounded-xl bg-muted"
                      />
                    ))}
                  </div>
                </section>
              ) : plans.length > 0 ? (
                <section className="mx-auto w-full max-w-3xl px-4 pt-20">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <h2 className="truncate text-sm text-muted-foreground">
                        Recently opened plans
                      </h2>
                    </div>
                    <Link
                      href="/app/plans"
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      View all
                      <ChevronRightIcon className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                  <PlanGrid plans={homePlans} />
                </section>
              ) : (
                <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
                  <InboxIcon className="size-10" strokeWidth={1.25} />
                  <div>
                    <h2 className="font-medium">
                      You don't have any saved plans yet
                    </h2>
                    <p className="">Create a plan to see it here.</p>
                  </div>
                </section>
              )}
            </AuiIf>
          </div>
        </ThreadPrimitive.Viewport>
      </ThreadPrimitive.Root>
    </>
  )
}

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role)
  const isEditing = useAuiState((s) => s.message.composer.isEditing)

  if (isEditing) return <EditComposer />
  if (role === "user") return <UserMessage />
  return <AssistantMessage />
}

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom
      render={
        <TooltipIconButton
          tooltip="Scroll to bottom"
          variant="outline"
          className="aui-thread-scroll-to-bottom absolute -top-12 z-100 self-center rounded-full p-4 disabled:invisible dark:border-border dark:bg-background dark:hover:bg-accent"
        />
      }
    >
      <ArrowDownIcon />
    </ThreadPrimitive.ScrollToBottom>
  )
}

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root my-auto flex grow flex-col space-y-12">
      <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
        <div className="aui-thread-welcome-message flex size-full flex-col justify-center px-4 text-center">
          <h1 className="aui-thread-welcome-message-inner mb-1 animate-in text-2xl font-medium tracking-tight delay-200 duration-200 fill-mode-both fade-in slide-in-from-bottom-1">
            What do you need to get done?
          </h1>
          <p className="aui-thread-welcome-message-inner animate-in text-muted-foreground delay-75 duration-200 fill-mode-both fade-in slide-in-from-bottom-1">
            Drop in the messy version. LockIn will turn it into a plan you can
            start.
          </p>
        </div>
      </div>
    </div>
  )
}

const ThreadPlanWelcome: FC = () => {
  return (
    <div className="aui-thread-plan-welcome-root mx-auto my-auto flex w-full grow flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
        className="aui-thread-plan-welcome-icon mb-2"
      >
        <Asterisk01 />
      </motion.div>
      <h1 className="aui-thread-plan-welcome-title mb-4 font-medium tracking-normal text-foreground">
        How can I help with your plan?
      </h1>
    </div>
  )
}

const ThreadSuggestions: FC<{
  mode?: "onboarding" | "plan"
}> = ({ mode = "onboarding" }) => {
  return (
    <div
      className={cn(
        "aui-thread-welcome-suggestions w-full gap-2 py-4",
        mode === "plan" ? "grid" : "flex flex-wrap justify-center"
      )}
    >
      <ThreadPrimitive.Suggestions>
        {() => <ThreadSuggestionItem />}
      </ThreadPrimitive.Suggestions>
    </div>
  )
}

const ThreadSuggestionItem: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestion-display animate-in duration-200 fill-mode-both fade-in slide-in-from-bottom-2 nth-[n+3]:hidden @md:nth-[n+3]:block">
      <SuggestionPrimitive.Trigger
        send
        render={
          <Button
            variant="ghost"
            className="aui-thread-welcome-suggestion h-auto flex-wrap items-start justify-center gap-1 border border-border bg-background px-3 py-1.5 text-start text-sm text-muted-foreground transition-colors hover:bg-muted @md:flex-col"
          />
        }
      >
        <SuggestionPrimitive.Title className="aui-thread-welcome-suggestion-text-1 font-normal" />
        <SuggestionPrimitive.Description className="aui-thread-welcome-suggestion-text-2 text-muted-foreground empty:hidden" />
      </SuggestionPrimitive.Trigger>
    </div>
  )
}

const Composer: FC<{
  mode?: "onboarding" | "plan"
  initialMentions?: MentionRef[]
  selectedModelId: string
  onSelectedModelChange: (value: string) => void
  selectedCapabilityId: string | undefined
  onSelectedCapabilityChange: (value: string | undefined) => void
}> = ({
  mode = "onboarding",
  initialMentions = [],
  selectedModelId,
  onSelectedModelChange,
  selectedCapabilityId,
  onSelectedCapabilityChange,
}) => {
  const [mentions, setMentions] = useState<MentionRef[]>(initialMentions)
  const initialMentionSignature = useMemo(
    () =>
      initialMentions
        .map((mention) => `${getMentionKey(mention)}:${mention.label}`)
        .join("|"),
    [initialMentions]
  )

  useEffect(() => {
    if (initialMentions.length === 0) {
      return
    }

    setMentions((currentMentions) => {
      const initialMentionsByKey = new Map(
        initialMentions.map((mention) => [getMentionKey(mention), mention])
      )
      const existingKeys = new Set(currentMentions.map(getMentionKey))
      let didChange = false
      const nextMentions = currentMentions.map((currentMention) => {
        const initialMention = initialMentionsByKey.get(
          getMentionKey(currentMention)
        )

        if (!initialMention || initialMention.label === currentMention.label) {
          return currentMention
        }

        didChange = true
        return initialMention
      })

      for (const mention of initialMentions) {
        if (!existingKeys.has(getMentionKey(mention))) {
          nextMentions.push(mention)
          didChange = true
        }
      }

      return didChange ? nextMentions : currentMentions
    })
  }, [initialMentionSignature, initialMentions])

  const removeMention = (mention: MentionRef) => {
    setMentions((currentMentions) =>
      currentMentions.filter(
        (currentMention) =>
          currentMention.type !== mention.type ||
          currentMention.id !== mention.id
      )
    )
  }

  return (
    <MentionComposerRoot
      mentions={mentions}
      resetMentions={initialMentions}
      setMentions={setMentions}
    >
      <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
        <ComposerPrimitive.AttachmentDropzone
          render={
            <div
              data-slot="aui_composer-shell"
              className="box-border flex w-full flex-col gap-2 rounded-(--composer-radius) border bg-background p-(--composer-padding) transition-shadow focus-within:border-ring/75 focus-within:shadow-md focus-within:ring-4 focus-within:ring-ring/20 data-[dragging=true]:bg-accent/50 data-[dragging=true]:outline-2 data-[dragging=true]:outline-dashed"
            />
          }
        >
          <ComposerAttachments />
          <MentionChips mentions={mentions} onRemove={removeMention} />
          <ComposerPrimitive.Input
            placeholder={
              mode === "plan"
                ? "Adjust this plan with AI..."
                : "What do you need to get done?"
            }
            className="aui-composer-input max-h-32 min-h-10 w-full resize-none bg-transparent px-1.75 py-1 text-sm outline-none placeholder:text-muted-foreground/80"
            rows={1}
            autoFocus
            aria-label="Message input"
          />
          <ComposerAction
            selectedModelId={selectedModelId}
            onSelectedModelChange={onSelectedModelChange}
            selectedCapabilityId={selectedCapabilityId}
            onSelectedCapabilityChange={onSelectedCapabilityChange}
          />
        </ComposerPrimitive.AttachmentDropzone>
      </ComposerPrimitive.Root>
    </MentionComposerRoot>
  )
}

const ComposerAction: FC<{
  selectedModelId: string
  onSelectedModelChange: (value: string) => void
  selectedCapabilityId: string | undefined
  onSelectedCapabilityChange: (value: string | undefined) => void
}> = ({
  selectedModelId,
  onSelectedModelChange,
  selectedCapabilityId,
  onSelectedCapabilityChange,
}) => {
  return (
    <div className="aui-composer-action-wrapper relative flex items-center justify-between">
      <div className="flex gap-1">
        <ComposerAddAttachment />
        <CapabilitiesSelector
          capabilities={AI_CAPABILITIES}
          value={selectedCapabilityId}
          onValueChange={onSelectedCapabilityChange}
          variant="ghost"
          size="sm"
        />
      </div>

      <div className="flex gap-2">
        <ModelSelector
          models={GEMINI_MODELS}
          value={selectedModelId}
          onValueChange={onSelectedModelChange}
          variant={"ghost"}
          size="sm"
        />

        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send
            render={
              <TooltipIconButton
                tooltip="Send message"
                side="bottom"
                type="button"
                variant="default"
                size="icon"
                className="aui-composer-send size-8"
                aria-label="Send message"
              />
            }
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel
            render={
              <Button
                type="button"
                variant="default"
                size="icon"
                className="aui-composer-cancel size-8"
                aria-label="Stop generating"
              />
            }
          >
            <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </div>
  )
}

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 py-3 text-sm text-destructive dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  )
}

const AssistantMessage: FC = () => {
  // reserves space for action bar and compensates with `-mb` for consistent msg spacing
  // keeps hovered action bar from shifting layout (autohide doesn't support absolute positioning well)
  // for pt-[n] use -mb-[n + 6] & min-h-[n + 6] to preserve compensation
  const ACTION_BAR_PT = "pt-1.5"
  const ACTION_BAR_HEIGHT = `-mb-7.5 min-h-7.5 ${ACTION_BAR_PT}`

  return (
    <MessagePrimitive.Root
      data-slot="aui_assistant-message-root"
      data-role="assistant"
      className="relative animate-in text-sm duration-150 [contain-intrinsic-size:auto_300px] fade-in slide-in-from-bottom-1"
    >
      <div
        data-slot="aui_assistant-message-content"
        className="px-2 pb-1 leading-relaxed wrap-break-word text-foreground [content-visibility:auto]"
      >
        <MessagePrimitive.GroupedParts
          groupBy={(part) => {
            if (part.type === "reasoning")
              return ["group-chainOfThought", "group-reasoning"]
            if (part.type === "tool-call") {
              if (getMcpAppFromToolPart(part)) return null
              return ["group-chainOfThought", "group-tool"]
            }
            return null
          }}
        >
          {({ part, children }) => {
            switch (part.type) {
              case "group-chainOfThought":
                return <div data-slot="aui_chain-of-thought">{children}</div>

              case "group-reasoning": {
                const running = part.status.type === "running"
                return (
                  <ReasoningRoot defaultOpen={running} variant="ghost">
                    <ReasoningTrigger />
                    <ReasoningContent aria-busy={running}>
                      <ReasoningText>{children}</ReasoningText>
                    </ReasoningContent>
                  </ReasoningRoot>
                )
              }

              case "group-tool":
                return (
                  <ToolGroupRoot variant="ghost" defaultOpen>
                    <ToolGroupTrigger
                      count={part.indices.length}
                      active={part.status.type === "running"}
                    />
                    <ToolGroupContent>{children}</ToolGroupContent>
                  </ToolGroupRoot>
                )

              case "text": {
                return <MarkdownText />
              }

              case "reasoning":
                return <Reasoning {...part} />

              case "tool-call":
                return <ToolCallDisplay {...part} />

              default:
                return null
            }
          }}
        </MessagePrimitive.GroupedParts>

        <MessageError />
      </div>

      <div
        data-slot="aui_assistant-message-footer"
        className={cn("ms-2 flex items-center", ACTION_BAR_HEIGHT)}
      >
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  )
}

const ToolCallDisplay: FC<ToolCallMessagePartProps> = (part) => {
  const Render = useAuiState((s) => {
    const entry = s.tools.tools[part.toolName] as
      | ToolCallMessagePartComponent
      | ToolCallMessagePartComponent[]
      | undefined

    return Array.isArray(entry) ? entry[0] : entry
  })

  return Render ? <Render {...part} /> : <ToolFallback {...part} />
}

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ms-1 flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy render={<TooltipIconButton tooltip="Copy" />}>
        <AuiIf condition={(s) => s.message.isCopied}>
          <CheckIcon />
        </AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}>
          <CopyIcon />
        </AuiIf>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload
        render={<TooltipIconButton tooltip="Refresh" />}
      >
        <RefreshCwIcon />
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger
          render={
            <TooltipIconButton
              tooltip="More"
              className="data-[state=open]:bg-accent"
            />
          }
        >
          <MoreHorizontalIcon />
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <ActionBarPrimitive.ExportMarkdown
            render={
              <ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground" />
            }
          >
            <DownloadIcon className="size-4" />
            Export as Markdown
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  )
}

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_user-message-root"
      className="grid animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 text-sm duration-150 [contain-intrinsic-size:auto_60px] [content-visibility:auto] fade-in slide-in-from-bottom-1 [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content peer rounded-2xl bg-sidebar-accent px-3 py-2 wrap-break-word text-foreground empty:hidden">
          <MessagePrimitive.Parts components={{ Text: MentionTextPart }} />
        </div>
        <div className="aui-user-action-bar-wrapper absolute start-0 top-1/2 -translate-x-full -translate-y-1/2 pe-2 peer-empty:hidden rtl:translate-x-full">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker
        data-slot="aui_user-branch-picker"
        className="col-span-full col-start-1 row-start-3 -me-1 justify-end"
      />
    </MessagePrimitive.Root>
  )
}

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit
        render={
          <TooltipIconButton
            tooltip="Edit"
            className="aui-user-action-edit p-2.5 text-muted-foreground hover:text-foreground data-[state=open]:bg-accent"
          />
        }
      >
        <PencilIcon />
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  )
}

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_edit-composer-wrapper"
      className="flex flex-col px-2"
    >
      <ComposerPrimitive.Root className="aui-edit-composer-root ms-auto flex w-full max-w-[40%] flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-sm text-foreground outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel
            render={<Button variant="ghost" size="sm" />}
          >
            Cancel
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send render={<Button size="sm" />}>
            Update
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  )
}

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root -ms-2 me-2 inline-flex items-center text-xs text-muted-foreground",
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous
        render={<TooltipIconButton tooltip="Previous" />}
      >
        <ChevronLeftIcon />
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next render={<TooltipIconButton tooltip="Next" />}>
        <ChevronRightIcon />
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  )
}
