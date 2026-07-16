"use client"

import * as React from "react"
import { Loader2Icon, SendHorizontalIcon, SparklesIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

// The coach only nudges; asking is capped so it stays a focus aid, not a
// crutch that answers the whole step for you.
const MAX_ASKS_PER_STEP = 2

type CoachMessage = { role: "user" | "coach"; content: string }

export function FocusCoachChat({
  stepId,
  stepTitle,
  guidance,
  planName,
}: {
  stepId: string
  stepTitle: string
  guidance?: string | null
  planName?: string | null
}) {
  const { t } = useTranslation()
  // Threads and ask-counts are kept per step so switching steps preserves each
  // step's short history and its own 2-ask budget for the sprint.
  const [threads, setThreads] = React.useState<Record<string, CoachMessage[]>>(
    {}
  )
  const [asks, setAsks] = React.useState<Record<string, number>>({})
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const messages = threads[stepId] ?? []
  const askCount = asks[stepId] ?? 0
  const remaining = Math.max(0, MAX_ASKS_PER_STEP - askCount)
  const atLimit = remaining <= 0

  const scrollRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages.length, loading])

  const send = async () => {
    const question = input.trim()
    if (!question || loading || atLimit) return

    setInput("")
    setError(null)
    setThreads((prev) => ({
      ...prev,
      [stepId]: [...(prev[stepId] ?? []), { role: "user", content: question }],
    }))
    setAsks((prev) => ({ ...prev, [stepId]: (prev[stepId] ?? 0) + 1 }))
    setLoading(true)

    try {
      const res = await fetch("/api/focus-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, stepTitle, guidance, planName }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(data?.error ?? t("app.focus.coach.replyError"))
      }
      const { reply } = (await res.json()) as { reply: string }
      setThreads((prev) => ({
        ...prev,
        [stepId]: [...(prev[stepId] ?? []), { role: "coach", content: reply }],
      }))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("app.focus.coach.genericError")
      )
      // A failed request shouldn't burn one of the two asks.
      setAsks((prev) => ({
        ...prev,
        [stepId]: Math.max(0, (prev[stepId] ?? 1) - 1),
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col rounded-xl border border-border/70 bg-background/50 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <SparklesIcon className="size-3.5 text-amber-500" />
          {t("app.focus.coach.title")}
        </p>
        <span className="text-[10px] font-medium text-muted-foreground">
          {t("app.focus.coach.remaining", {
            remaining,
            total: MAX_ASKS_PER_STEP,
          })}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-40 min-h-[3.5rem] overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 && !loading ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("app.focus.coach.emptyPrefix")}{" "}
            <strong>{t("app.focus.coach.approach")}</strong>{" "}
            {t("app.focus.coach.emptySuffix")}
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <p
                  className={`max-w-[85%] rounded-lg px-3 py-1.5 text-xs leading-relaxed ${
                    message.role === "user"
                      ? "bg-amber-500/15 text-foreground"
                      : "bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <p className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                  <Loader2Icon className="size-3 animate-spin" />
                  {t("app.focus.coach.thinking")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-1 text-[10px] text-rose-500">{error}</p>}

      <div className="border-t border-border/60 p-2">
        {atLimit ? (
          <p className="px-2 py-1.5 text-center text-[11px] text-muted-foreground">
            {t("app.focus.coach.limitReached", {
              total: MAX_ASKS_PER_STEP,
            })}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
              disabled={loading}
              placeholder={t("app.focus.coach.placeholder")}
              className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-foreground transition-colors outline-none focus-visible:border-amber-400/70 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading || input.trim().length === 0}
              aria-label={t("app.focus.coach.sendAria")}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white transition-colors hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
            >
              {loading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendHorizontalIcon className="size-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
