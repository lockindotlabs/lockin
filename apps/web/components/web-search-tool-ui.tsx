"use client"

import {
  type ToolCallMessagePartProps,
  useAssistantToolUI,
  useInlineRender,
} from "@assistant-ui/react"
import { SearchIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type WebSearchToolArgs = {
  query?: string
  searchDepth?: "basic" | "advanced" | "fast" | "ultra-fast"
  timeRange?: "year" | "month" | "week" | "day" | "y" | "m" | "w" | "d"
  exactMatch?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseArgsText(argsText: string | undefined): WebSearchToolArgs {
  if (!argsText) {
    return {}
  }

  try {
    const parsed = JSON.parse(argsText)
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function getSearchQuery(args: WebSearchToolArgs, argsText: string | undefined) {
  const parsedArgs = parseArgsText(argsText)
  const query = args.query ?? parsedArgs.query

  return typeof query === "string" ? query.trim() : ""
}

function WebSearchToolCard({
  args,
  argsText,
  status,
}: ToolCallMessagePartProps<WebSearchToolArgs, unknown>) {
  const query = getSearchQuery(isRecord(args) ? args : {}, argsText)
  const isRunning = status.type === "running"
  const visibleQuery = query || "Searching..."

  return (
    <section
      aria-busy={isRunning}
      className="w-full rounded-2xl border bg-background p-4"
      data-slot="web-search-tool-ui"
    >
      <div className="mb-3 flex items-center gap-2 text-foreground">
        <SearchIcon
          aria-hidden="true"
          className={cn("size-4 shrink-0", isRunning && "animate-pulse")}
        />
        <h3 className="text-sm font-medium">Searched for information</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            "max-w-full rounded-full border border-muted-foreground/40 px-2 py-1 text-[13px] leading-snug text-muted-foreground",
            isRunning && !query && "animate-pulse"
          )}
        >
          {visibleQuery}
        </span>
      </div>
    </section>
  )
}

export function WebSearchAssistantToolUI() {
  const renderWebSearchTool = useInlineRender<WebSearchToolArgs, unknown>(
    (props) => <WebSearchToolCard {...props} />
  )

  useAssistantToolUI({
    toolName: "webSearch",
    render: renderWebSearchTool,
  })

  return null
}
