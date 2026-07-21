"use client"

/**
 * ask-choice-tool-ui.tsx
 * ---------------------------------------------------------------------------
 * LockIn "Ask" — multiple-choice clarifying question (direction A · numbered rows).
 *
 * A human-in-the-loop frontend tool. The model calls `askChoice` with a
 * question + options; the tool has NO `execute`, so assistant-ui parks the
 * tool call in a `requires-action` state and renders this card. When the user
 * picks a row (or types a custom answer, or skips) we resolve the tool call
 * with `addResult(...)`, which streams the answer back to the model so the
 * conversation continues.
 *
 * Wiring (drop into the tools provider that <Thread/> renders inside —
 * alongside <PlanAssistantTools/> and <WebSearchAssistantToolUI/>):
 *
 *   import { AskChoiceTool } from "@/components/ask-choice-tool-ui"
 *   ...
 *   <AskChoiceTool />
 *
 * The frontend tool definition is forwarded to the server route via
 * `frontendTools(tools)` (see app/api/chat/route.ts), so no server change is
 * needed beyond letting the model know the tool exists.
 * ---------------------------------------------------------------------------
 */

import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  type ToolCallMessagePartProps,
  useAssistantTool,
  useAssistantToolUI,
  useInlineRender,
} from "@assistant-ui/react"
import { CheckIcon, PencilIcon, SparklesIcon, XIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

/* ------------------------------ tool schema ------------------------------ */

type AskChoiceOptionInput = { label: string; description?: string }

type AskChoiceArgs = {
  /** The clarifying question, sentence case, no trailing context. */
  question?: string
  /** 2–6 mutually exclusive options. */
  options?: AskChoiceOptionInput[]
  /** One-line summary of the reasoning that led to the question (shown above). */
  context?: string
  /** Allow a free-text "Something else" answer. Default true. */
  allowOther?: boolean
  /** Allow dismissing without answering. Default true. */
  allowSkip?: boolean
  /** Optional progress, e.g. { step: 2, total: 3 } — display only. */
  step?: number
  total?: number
}

type AskChoiceResult = {
  /** The chosen option label, the custom text, or "" when skipped. */
  answer: string
  /** Index into `options`, or null for a custom / skipped answer. */
  optionIndex: number | null
  isCustom?: boolean
  skipped?: boolean
}

type AskChoicesBatchQuestionInput = {
  id?: string
  question?: string
  options?: AskChoiceOptionInput[]
  allowOther?: boolean
  allowSkip?: boolean
}

type AskChoicesBatchArgs = {
  /** One-line summary of why this batch is being asked. */
  context?: string
  /** 1-5 multiple-choice questions submitted as one frontend tool result. */
  questions?: AskChoicesBatchQuestionInput[]
}

type AskChoicesBatchAnswer = AskChoiceResult & {
  id: string
  question: string
}

type AskChoicesBatchResult = {
  answers: AskChoicesBatchAnswer[]
}

const askChoiceParameters = {
  type: "object" as const,
  properties: {
    question: {
      type: "string" as const,
      description:
        "The clarifying question to ask, in sentence case. Keep it to one line.",
    },
    options: {
      type: "array" as const,
      description:
        "Two to six mutually exclusive answers. Each item has a short label and optional one-line description.",
      items: {
        type: "object" as const,
        properties: {
          label: { type: "string" as const },
          description: { type: "string" as const },
        },
        required: ["label"],
      },
    },
    context: {
      type: "string" as const,
      description:
        "Optional one-line summary of why you are asking, shown as a lead-in above the card.",
    },
    allowOther: {
      type: "boolean" as const,
      description: "Whether to offer a free-text answer. Defaults to true.",
    },
    allowSkip: {
      type: "boolean" as const,
      description: "Whether the question can be dismissed. Defaults to true.",
    },
    step: {
      type: "number" as const,
      description: "Optional 1-based step index.",
    },
    total: {
      type: "number" as const,
      description: "Optional total step count.",
    },
  },
  required: ["question", "options"],
}

const askChoicesBatchParameters = {
  type: "object" as const,
  properties: {
    context: {
      type: "string" as const,
      description:
        "Optional one-line summary of why these questions are being asked.",
    },
    questions: {
      type: "array" as const,
      description:
        "One to five bounded multiple-choice questions to ask in a single batch.",
      items: {
        type: "object" as const,
        properties: {
          id: {
            type: "string" as const,
            description:
              "Stable short identifier for this question, such as scope or deadline.",
          },
          question: {
            type: "string" as const,
            description: "The clarifying question to ask.",
          },
          options: {
            type: "array" as const,
            description:
              "Two to six mutually exclusive answers. Each item has a short label and optional one-line description.",
            items: {
              type: "object" as const,
              properties: {
                label: { type: "string" as const },
                description: { type: "string" as const },
              },
              required: ["label"],
            },
          },
          allowOther: {
            type: "boolean" as const,
            description:
              "Whether to offer a free-text answer. Defaults to true.",
          },
          allowSkip: {
            type: "boolean" as const,
            description:
              "Whether this question can be skipped. Defaults to true.",
          },
        },
        required: ["id", "question", "options"],
      },
    },
  },
  required: ["questions"],
}

/* -------------------------------- helpers -------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/** Merge structured args with a best-effort parse of the streaming argsText,
 *  so the card can render question + options before the call fully resolves. */
function parseArgs(
  args: AskChoiceArgs,
  argsText: string | undefined
): AskChoiceArgs {
  if (isRecord(args) && (args.question || args.options)) return args
  if (!argsText) return args ?? {}
  try {
    const parsed = JSON.parse(argsText)
    return isRecord(parsed) ? (parsed as AskChoiceArgs) : (args ?? {})
  } catch {
    return args ?? {}
  }
}

function parseBatchArgs(
  args: AskChoicesBatchArgs,
  argsText: string | undefined
): AskChoicesBatchArgs {
  if (isRecord(args) && args.questions) return args
  if (!argsText) return args ?? {}
  try {
    const parsed = JSON.parse(argsText)
    return isRecord(parsed) ? (parsed as AskChoicesBatchArgs) : (args ?? {})
  } catch {
    return args ?? {}
  }
}

type NormalizedOption = { label: string; description?: string }

function normalizeOptions(
  options: AskChoiceArgs["options"]
): NormalizedOption[] {
  if (!Array.isArray(options)) return []
  return options.flatMap((opt): NormalizedOption[] => {
    if (!isRecord(opt) || typeof opt.label !== "string") return []

    const label = opt.label.trim()
    if (!label) return []

    return [
      {
        label,
        description:
          typeof opt.description === "string"
            ? opt.description.trim()
            : undefined,
      },
    ]
  })
}

function isSavePlanConfirmation(question: string, options: NormalizedOption[]) {
  if (options.length !== 2) return false

  const labels = options.map((option) => option.label.toLowerCase())
  return (
    /save/i.test(question) ||
    (labels.includes("save plan") && labels.includes("not now"))
  )
}

type NormalizedBatchQuestion = {
  id: string
  question: string
  options: NormalizedOption[]
  allowOther: boolean
  allowSkip: boolean
}

function normalizeBatchQuestions(
  questions: AskChoicesBatchArgs["questions"]
): NormalizedBatchQuestion[] {
  if (!Array.isArray(questions)) return []

  return questions.slice(0, 5).flatMap((question, index) => {
    if (!isRecord(question) || typeof question.question !== "string") {
      return []
    }

    const text = question.question.trim()
    const options = normalizeOptions(question.options)

    if (!text || options.length === 0) return []

    const id =
      typeof question.id === "string" && question.id.trim()
        ? question.id.trim()
        : `question-${index + 1}`

    return [
      {
        id,
        question: text,
        options,
        allowOther: question.allowOther !== false,
        allowSkip: question.allowSkip !== false,
      },
    ]
  })
}

/* ------------------------------- the card -------------------------------- */

function AskChoiceCard({
  args,
  argsText,
  status,
  result,
  addResult,
}: ToolCallMessagePartProps<AskChoiceArgs, AskChoiceResult>) {
  const { t } = useTranslation()
  const resolved = parseArgs(isRecord(args) ? args : {}, argsText)
  const question = (resolved.question ?? "").trim()
  const options = normalizeOptions(resolved.options)
  const allowOther = resolved.allowOther !== false
  const allowSkip = resolved.allowSkip !== false
  const context = resolved.context?.trim()
  const isSavePrompt = isSavePlanConfirmation(question, options)

  const isStreaming = status.type === "running" && options.length === 0
  const isCancelled = status.type === "incomplete"
  const answered = result !== undefined && result !== null

  const [selected, setSelected] = React.useState<number | null>(null)
  const [customOpen, setCustomOpen] = React.useState(false)
  const [customValue, setCustomValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const submit = React.useCallback(
    (payload: AskChoiceResult) => {
      if (answered) return
      addResult(payload)
    },
    [addResult, answered]
  )

  const choose = (index: number) => {
    setSelected(index)
    setCustomOpen(false)
    setCustomValue("")
    submit({ answer: options[index]!.label, optionIndex: index })
  }

  const submitCustom = () => {
    const value = customValue.trim()
    if (!value) return
    submit({ answer: value, optionIndex: null, isCustom: true })
  }

  const skip = () => submit({ answer: "", optionIndex: null, skipped: true })

  const openCustom = () => {
    setCustomOpen(true)
    setSelected(null)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // Keyboard: number keys 1–9 pick an option while the card is live and the
  // custom input isn't focused.
  React.useEffect(() => {
    if (answered || isCancelled) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.isContentEditable)) {
        return
      }
      const n = Number(event.key)
      if (Number.isInteger(n) && n >= 1 && n <= options.length) {
        event.preventDefault()
        choose(n - 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, isCancelled, options.length])

  /* ---- answered / dismissed: compact read-only summary ---- */
  if (answered || isCancelled) {
    const summary: AskChoiceResult | undefined =
      (result as AskChoiceResult | undefined) ?? undefined
    const skipped = summary?.skipped || isCancelled
    return (
      <section
        data-slot="ask-choice-tool-ui"
        className="w-full overflow-hidden rounded-2xl border bg-background"
      >
        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3.5">
            {skipped ? <XIcon /> : <CheckIcon />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-snug text-muted-foreground">
              {question || "Clarifying question"}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-foreground">
              {skipped
                ? t("app.aiTools.skipped", { defaultValue: "Skipped" })
                : summary?.answer ||
                  t("app.aiTools.answered", { defaultValue: "Answered" })}
            </p>
          </div>
        </div>
      </section>
    )
  }

  /* ---- live, interactive question ---- */
  return (
    <div data-slot="ask-choice-tool-ui" className="w-full">
      {context && (
        <div className="mb-2.5 flex items-center gap-2 pl-0.5">
          <span className="truncate">{context}</span>
        </div>
      )}

      <section
        aria-busy={isStreaming}
        className="w-full overflow-hidden rounded-2xl border bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-28px_rgba(0,0,0,0.18)]"
      >
        {/* header */}
        <div className="flex items-center gap-4 px-4 py-2">
          <div className="min-w-0 flex-1">
            <h3 className="leading-snug font-medium text-balance text-foreground">
              {question ||
                (isStreaming
                  ? t("app.aiTools.thinkingQuestion", {
                      defaultValue: "Thinking of a question...",
                    })
                  : "")}
            </h3>
          </div>

          <div className="flex shrink-0 items-start gap-1 pt-0.5">
            {typeof resolved.step === "number" &&
              typeof resolved.total === "number" && (
                <span
                  className="px-1 text-xs text-muted-foreground tabular-nums"
                  style={{
                    fontFamily: "var(--font-ibm-mono), ui-monospace, monospace",
                  }}
                >
                  <span className="font-medium text-foreground">
                    {resolved.step}
                  </span>{" "}
                  {t("app.aiTools.of", { defaultValue: "of" })} {resolved.total}
                </span>
              )}
            {allowSkip && (
              <button
                type="button"
                onClick={skip}
                aria-label={t("app.aiTools.dismissQuestion", {
                  defaultValue: "Dismiss question",
                })}
                className="flex size-6.5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-[17px]"
              >
                <XIcon />
              </button>
            )}
          </div>
        </div>

        {/* option rows */}
        <div className="flex flex-col">
          {isSavePrompt ? (
            <div className="grid gap-3 border-t border-border px-4 py-4 sm:grid-cols-2">
              {options.map((opt, i) => (
                <Button
                  key={`${opt.label}-${i}`}
                  type="button"
                  variant={i === 0 ? "default" : "outline"}
                  className="h-auto justify-start px-4 py-3 text-left"
                  onClick={() => choose(i)}
                >
                  <span className="block">
                    <span className="block font-medium">{opt.label}</span>
                    {opt.description && (
                      <span className="mt-1 block text-xs text-current/75">
                        {opt.description}
                      </span>
                    )}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            options.map((opt, i) => {
              const isSel = selected === i
              return (
                <button
                  key={`${opt.label}-${i}`}
                  type="button"
                  onClick={() => choose(i)}
                  className={cn(
                    "group flex w-full items-center gap-4 border-t border-border px-4 py-3.5 text-left transition-colors",
                    "hover:bg-muted active:translate-y-px",
                    isSel && "bg-primary/10"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border text-[13px] transition-colors",
                      "bg-muted text-muted-foreground",
                      isSel &&
                        "border-primary bg-primary text-primary-foreground"
                    )}
                    style={{
                      fontFamily:
                        "var(--font-ibm-mono), ui-monospace, monospace",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="truncate font-medium">{opt.label}</span>
                    {opt.description && (
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {opt.description}
                      </span>
                    )}
                  </span>
                  <CheckIcon
                    className={cn(
                      "size-[18px] shrink-0 text-primary transition-[transform,opacity]",
                      isSel ? "scale-100 opacity-100" : "scale-50 opacity-0"
                    )}
                  />
                </button>
              )
            })
          )}

          {/* "Something else" custom row */}
          {allowOther && !isSavePrompt && (
            <div
              className={cn(
                "flex items-center gap-4 border-t border-border px-4 py-3 transition-colors",
                customOpen && "bg-muted"
              )}
            >
              <button
                type="button"
                onClick={openCustom}
                aria-label={t("app.aiTools.writeOwnAnswer", {
                  defaultValue: "Write your own answer",
                })}
                className={cn(
                  "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border bg-background text-muted-foreground transition-colors [&_svg]:size-[15px]",
                  customOpen &&
                    "border-primary bg-primary text-primary-foreground"
                )}
              >
                <PencilIcon />
              </button>
              <input
                ref={inputRef}
                value={customValue}
                onFocus={() => setCustomOpen(true)}
                onChange={(e) => {
                  setCustomValue(e.target.value)
                  setSelected(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    submitCustom()
                  }
                }}
                placeholder={t("app.aiTools.somethingElse", {
                  defaultValue: "Something else...",
                })}
                className="min-w-0 flex-1 bg-transparent text-muted-foreground outline-none placeholder:text-muted-foreground"
              />
              {customValue.trim() ? (
                <button
                  type="button"
                  onClick={submitCustom}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground shadow-[0_6px_14px_-6px_rgba(249,179,20,0.5)] transition-colors hover:bg-[#ffc22e]"
                >
                  {t("app.aiTools.send", { defaultValue: "Send" })}
                </button>
              ) : (
                allowSkip && (
                  <button
                    type="button"
                    onClick={skip}
                    className="inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {t("app.aiTools.skip", { defaultValue: "Skip" })}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function AskChoicesBatchCard({
  args,
  argsText,
  status,
  result,
  addResult,
}: ToolCallMessagePartProps<AskChoicesBatchArgs, AskChoicesBatchResult>) {
  const { t } = useTranslation()
  const resolved = parseBatchArgs(isRecord(args) ? args : {}, argsText)
  const questions = normalizeBatchQuestions(resolved.questions)
  const context = resolved.context?.trim()
  const isStreaming = status.type === "running" && questions.length === 0
  const isCancelled = status.type === "incomplete"
  const answered = result !== undefined && result !== null
  const isSingle = questions.length === 1
  const lastQuestionIndex = Math.max(questions.length - 1, 0)

  const [answers, setAnswers] = React.useState<Record<string, AskChoiceResult>>(
    {}
  )
  const [customOpen, setCustomOpen] = React.useState<Record<string, boolean>>(
    {}
  )
  const [customValues, setCustomValues] = React.useState<
    Record<string, string>
  >({})
  const [activeIndex, setActiveIndex] = React.useState(0)

  React.useEffect(() => {
    setActiveIndex((current) => Math.min(current, lastQuestionIndex))
  }, [lastQuestionIndex])

  const activeQuestion = questions[activeIndex]
  const currentAnswer = activeQuestion ? answers[activeQuestion.id] : undefined
  const currentCustomValue = activeQuestion
    ? (customValues[activeQuestion.id] ?? "")
    : ""
  const isCustomOpen = activeQuestion
    ? (customOpen[activeQuestion.id] ?? false)
    : false

  const buildAnswer = React.useCallback(
    (
      question: NormalizedBatchQuestion,
      answer: AskChoiceResult
    ): AskChoicesBatchAnswer => ({
      id: question.id,
      question: question.question,
      ...answer,
    }),
    []
  )

  const submitBatch = React.useCallback(
    (nextAnswers: Record<string, AskChoiceResult>) => {
      if (answered) return

      if (questions.some((question) => !nextAnswers[question.id])) return

      const payloadAnswers = questions.map((question) =>
        buildAnswer(question, nextAnswers[question.id]!)
      )

      addResult({ answers: payloadAnswers })
    },
    [addResult, answered, buildAnswer, questions]
  )

  const advanceAfterAnswer = (
    question: NormalizedBatchQuestion,
    nextAnswers: Record<string, AskChoiceResult>
  ) => {
    const questionIndex = questions.findIndex((item) => item.id === question.id)
    const isLastQuestion = questionIndex >= lastQuestionIndex

    if (isSingle || isLastQuestion) {
      submitBatch(nextAnswers)
      return
    }

    setActiveIndex(questionIndex + 1)
  }

  const setQuestionAnswer = (
    question: NormalizedBatchQuestion,
    answer: AskChoiceResult
  ) => {
    const nextAnswers = { ...answers, [question.id]: answer }
    setAnswers(nextAnswers)
    advanceAfterAnswer(question, nextAnswers)
  }

  const choose = (question: NormalizedBatchQuestion, index: number) => {
    setCustomOpen((current) => ({ ...current, [question.id]: false }))
    setCustomValues((current) => ({ ...current, [question.id]: "" }))
    setQuestionAnswer(question, {
      answer: question.options[index]!.label,
      optionIndex: index,
    })
  }

  const submitCustom = (question: NormalizedBatchQuestion) => {
    const value = customValues[question.id]?.trim() ?? ""
    if (!value) return

    setQuestionAnswer(question, {
      answer: value,
      optionIndex: null,
      isCustom: true,
    })
  }

  const skip = (question: NormalizedBatchQuestion) => {
    setQuestionAnswer(question, {
      answer: "",
      optionIndex: null,
      skipped: true,
    })
  }

  if (answered || isCancelled) {
    const summaryAnswers =
      (result as AskChoicesBatchResult | undefined)?.answers ?? []

    return (
      <section
        data-slot="ask-choices-batch-tool-ui"
        className="w-full overflow-hidden rounded-xl border bg-background"
      >
        <div className="flex items-start gap-3 p-4">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3.5">
            {isCancelled ? <XIcon /> : <CheckIcon />}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="mt-0.25 text-[13px] leading-snug text-muted-foreground">
              {context || "Clarifying questions"}
            </p>
            <div className="space-y-1.5">
              {summaryAnswers.length > 0 ? (
                summaryAnswers.map((answer) => (
                  <div key={answer.id} className="min-w-0">
                    <p className="truncate text-[13px] text-muted-foreground">
                      {answer.question}
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {answer.skipped ? "Skipped" : answer.answer || "Answered"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {isCancelled
                    ? t("app.aiTools.skipped", { defaultValue: "Skipped" })
                    : t("app.aiTools.answered", { defaultValue: "Answered" })}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div data-slot="ask-choices-batch-tool-ui" className="w-full">
      {context && (
        <div className="mb-2.5 flex items-center gap-2 pl-0.5">
          <p>{context}</p>
        </div>
      )}

      <section
        aria-busy={isStreaming}
        className="w-full overflow-hidden rounded-xl border bg-background"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <h3 className="text-sm leading-snug text-muted-foreground">
            {isStreaming
              ? t("app.aiTools.thinkingQuestions", {
                  defaultValue: "Thinking of questions...",
                })
              : questions.length === 1
                ? t("app.aiTools.clarifyingQuestion", {
                    defaultValue: "Clarifying question",
                  })
                : t("app.aiTools.clarifyingQuestions", {
                    defaultValue: "Clarifying questions",
                  })}
          </h3>
          {questions.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {activeIndex + 1} {t("app.aiTools.of", { defaultValue: "of" })}{" "}
              {questions.length}
            </span>
          )}
        </div>

        {activeQuestion && (
          <div className="flex flex-col border-t border-border">
            <div className="flex items-start justify-between gap-4 py-3 pr-3 pl-4">
              <div className="min-w-0 flex-1">
                {questions.length > 1 && (
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("app.aiTools.questionNumber", {
                      number: activeIndex + 1,
                      defaultValue: `Question ${activeIndex + 1}`,
                    })}
                  </p>
                )}
                <p className="leading-snug font-medium text-foreground">
                  {activeQuestion.question}
                </p>
              </div>
              {activeQuestion.allowSkip && (
                <Button
                  onClick={() => skip(activeQuestion)}
                  aria-label={t("app.aiTools.skipQuestion", {
                    defaultValue: "Skip question",
                  })}
                  variant={"ghost"}
                  size={"xs"}
                  className={"text-muted-foreground"}
                >
                  {t("app.aiTools.skip", { defaultValue: "Skip" })}
                </Button>
              )}
            </div>

            <div className="flex flex-col">
              {activeQuestion.options.map((option, optionIndex) => {
                const isSelected =
                  currentAnswer?.optionIndex === optionIndex &&
                  !currentAnswer?.isCustom &&
                  !currentAnswer?.skipped

                return (
                  <button
                    key={`${activeQuestion.id}-${option.label}-${optionIndex}`}
                    type="button"
                    onClick={() => choose(activeQuestion, optionIndex)}
                    className={cn(
                      "group flex w-full items-center gap-4 border-t border-border px-4 py-3.5 text-left transition-colors",
                      "hover:bg-muted active:translate-y-px",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border text-[13px] transition-colors",
                        "bg-muted text-muted-foreground",
                        isSelected &&
                          "border-primary bg-primary text-primary-foreground"
                      )}
                      style={{
                        fontFamily:
                          "var(--font-ibm-mono), ui-monospace, monospace",
                      }}
                    >
                      {optionIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="truncate font-medium">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block truncate text-[13px] text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                    <CheckIcon
                      className={cn(
                        "size-[18px] shrink-0 text-primary transition-[transform,opacity]",
                        isSelected
                          ? "scale-100 opacity-100"
                          : "scale-50 opacity-0"
                      )}
                    />
                  </button>
                )
              })}

              {activeQuestion.allowOther && (
                <div
                  className={cn(
                    "flex items-center gap-4 border-t border-border px-4 py-3 transition-colors",
                    isCustomOpen && "bg-muted"
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCustomOpen((current) => ({
                        ...current,
                        [activeQuestion.id]: true,
                      }))
                    }
                    aria-label={t("app.aiTools.writeOwnAnswer", {
                      defaultValue: "Write your own answer",
                    })}
                    className={cn(
                      "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border bg-background text-muted-foreground transition-colors [&_svg]:size-[15px]",
                      (isCustomOpen || currentAnswer?.isCustom) &&
                        "border-primary bg-primary text-primary-foreground"
                    )}
                  >
                    <PencilIcon />
                  </button>
                  <input
                    value={currentCustomValue}
                    onFocus={() =>
                      setCustomOpen((current) => ({
                        ...current,
                        [activeQuestion.id]: true,
                      }))
                    }
                    onChange={(event) => {
                      setCustomValues((current) => ({
                        ...current,
                        [activeQuestion.id]: event.target.value,
                      }))
                      setAnswers((current) => {
                        if (!current[activeQuestion.id]?.isCustom) {
                          return current
                        }
                        const { [activeQuestion.id]: _removed, ...rest } =
                          current
                        return rest
                      })
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        submitCustom(activeQuestion)
                      }
                    }}
                    placeholder={t("app.aiTools.somethingElse", {
                      defaultValue: "Something else...",
                    })}
                    className="min-w-0 flex-1 bg-transparent text-muted-foreground outline-none placeholder:text-muted-foreground"
                  />
                  {currentCustomValue.trim() && (
                    <button
                      type="button"
                      onClick={() => submitCustom(activeQuestion)}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground shadow-[0_6px_14px_-6px_rgba(249,179,20,0.5)] transition-colors hover:bg-[#ffc22e]"
                    >
                      {isSingle || activeIndex === lastQuestionIndex
                        ? t("app.aiTools.send", { defaultValue: "Send" })
                        : t("app.aiTools.set", { defaultValue: "Set" })}
                    </button>
                  )}
                </div>
              )}

              {currentAnswer?.skipped && (
                <div className="border-t border-border px-4 py-2 text-sm text-muted-foreground">
                  {t("app.aiTools.skipped", { defaultValue: "Skipped" })}
                </div>
              )}
            </div>
          </div>
        )}

        {questions.length > 1 && activeIndex > 0 && !answered && (
          <div className="flex items-center justify-start border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={() =>
                setActiveIndex((current) => Math.max(0, current - 1))
              }
              className="inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t("app.aiTools.back", { defaultValue: "Back" })}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

/* ------------------------------ registration ----------------------------- */

/**
 * Registers the `askChoice` frontend tool (no `execute` → human-in-the-loop)
 * and its inline UI. Render once inside the assistant runtime provider.
 */
export function AskChoiceTool() {
  const tool = React.useMemo(
    () => ({
      toolName: "askChoice",
      description:
        "Ask the user a single multiple-choice clarifying question and wait for their answer. " +
        "Use when you need one decision to proceed and the likely answers are a small, known set. " +
        "Prefer this over a plain text question when 2–6 concrete options cover the space. " +
        "The result contains the chosen answer, its option index, and whether it was custom or skipped.",
      parameters: askChoiceParameters,
      // No execute: the answer is supplied by the UI via addResult.
    }),
    []
  )

  const batchTool = React.useMemo(
    () => ({
      toolName: "askChoicesBatch",
      description:
        "Ask the user one or more multiple-choice clarifying questions in a single batch and wait for all answers. " +
        "Use this as the preferred clarification tool, including when you only need one question. " +
        "The result contains an answers array with each question id, question text, selected answer, option index, and whether it was custom or skipped.",
      parameters: askChoicesBatchParameters,
      // No execute: the answers are supplied by the UI via addResult.
    }),
    []
  )

  const render = useInlineRender<AskChoiceArgs, AskChoiceResult>((props) => (
    <AskChoiceCard {...props} />
  ))
  const renderBatch = useInlineRender<
    AskChoicesBatchArgs,
    AskChoicesBatchResult
  >((props) => <AskChoicesBatchCard {...props} />)

  useAssistantTool(tool)
  useAssistantTool(batchTool)
  useAssistantToolUI({ toolName: "askChoice", render })
  useAssistantToolUI({ toolName: "askChoicesBatch", render: renderBatch })

  return null
}

export { AskChoiceCard, AskChoicesBatchCard }
export type {
  AskChoiceArgs,
  AskChoiceResult,
  AskChoicesBatchArgs,
  AskChoicesBatchResult,
}
