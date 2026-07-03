"use client"

import * as React from "react"
import {
  type ToolCallMessagePartProps,
  useAssistantTool,
  useAssistantToolUI,
  useInlineRender,
} from "@assistant-ui/react"
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

type AskScaffoldQuestionInput = {
  id?: string
  label?: string
  question?: string
  placeholder?: string
  helperText?: string
  required?: boolean
  minWords?: number
}

type AskScaffoldBatchArgs = {
  context?: string
  title?: string
  questions?: AskScaffoldQuestionInput[]
}

type AskScaffoldBatchAnswer = {
  id: string
  label: string
  question: string
  answer: string
  wordCount: number
}

type AskScaffoldBatchResult = {
  answers: AskScaffoldBatchAnswer[]
}

const askScaffoldBatchParameters = {
  type: "object" as const,
  properties: {
    context: {
      type: "string" as const,
      description:
        "Optional one-line explanation of why this scaffold is needed before planning.",
    },
    title: {
      type: "string" as const,
      description:
        "Optional short title for the scaffold card, such as Template intake or Startup thinking scaffold.",
    },
    questions: {
      type: "array" as const,
      description:
        "Two to five open-text scaffold questions that gather planning context from the user.",
      items: {
        type: "object" as const,
        properties: {
          id: {
            type: "string" as const,
            description: "Stable short identifier for the scaffold field.",
          },
          label: {
            type: "string" as const,
            description: "Short field label shown above the input.",
          },
          question: {
            type: "string" as const,
            description: "The main open-text question to ask the user.",
          },
          placeholder: {
            type: "string" as const,
            description: "Optional placeholder example for the input.",
          },
          helperText: {
            type: "string" as const,
            description: "Optional hint that nudges the user toward a better answer.",
          },
          required: {
            type: "boolean" as const,
            description: "Whether this field must be answered before submission. Defaults to true.",
          },
          minWords: {
            type: "number" as const,
            description: "Minimum suggested word count before the answer is considered complete. Defaults to 12.",
          },
        },
        required: ["id", "label", "question"],
      },
    },
  },
  required: ["questions"],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseArgs(
  args: AskScaffoldBatchArgs,
  argsText: string | undefined
): AskScaffoldBatchArgs {
  if (isRecord(args) && args.questions) return args
  if (!argsText) return args ?? {}
  try {
    const parsed = JSON.parse(argsText)
    return isRecord(parsed) ? (parsed as AskScaffoldBatchArgs) : (args ?? {})
  } catch {
    return args ?? {}
  }
}

type NormalizedScaffoldQuestion = {
  id: string
  label: string
  question: string
  placeholder?: string
  helperText?: string
  required: boolean
  minWords: number
}

function normalizeQuestions(
  questions: AskScaffoldBatchArgs["questions"]
): NormalizedScaffoldQuestion[] {
  if (!Array.isArray(questions)) return []

  return questions.slice(0, 5).flatMap((question, index) => {
    if (!isRecord(question)) return []

    const id =
      typeof question.id === "string" && question.id.trim()
        ? question.id.trim()
        : `scaffold-${index + 1}`
    const label =
      typeof question.label === "string" && question.label.trim()
        ? question.label.trim()
        : `Field ${index + 1}`
    const prompt =
      typeof question.question === "string" ? question.question.trim() : ""

    if (!prompt) return []

    return [
      {
        id,
        label,
        question: prompt,
        placeholder:
          typeof question.placeholder === "string"
            ? question.placeholder.trim()
            : undefined,
        helperText:
          typeof question.helperText === "string"
            ? question.helperText.trim()
            : undefined,
        required: question.required !== false,
        minWords:
          typeof question.minWords === "number" &&
          Number.isFinite(question.minWords) &&
          question.minWords > 0
            ? Math.round(question.minWords)
            : 12,
      },
    ]
  })
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function AskScaffoldBatchCard({
  args,
  argsText,
  status,
  result,
  addResult,
}: ToolCallMessagePartProps<AskScaffoldBatchArgs, AskScaffoldBatchResult>) {
  const resolved = parseArgs(isRecord(args) ? args : {}, argsText)
  const questions = normalizeQuestions(resolved.questions)
  const context = resolved.context?.trim()
  const title = resolved.title?.trim() || "Planning scaffold"
  const isStreaming = status.type === "running" && questions.length === 0
  const isCancelled = status.type === "incomplete"
  const answered = result !== undefined && result !== null
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [submitted, setSubmitted] = React.useState(false)

  React.useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(questions.length - 1, 0)))
  }, [questions.length])

  const activeQuestion = questions[activeIndex]

  const buildSummary = React.useCallback((): AskScaffoldBatchResult => {
    return {
      answers: questions.map((question) => {
        const answer = (values[question.id] ?? "").trim()
        return {
          id: question.id,
          label: question.label,
          question: question.question,
          answer,
          wordCount: countWords(answer),
        }
      }),
    }
  }, [questions, values])

  const validationMap = React.useMemo(() => {
    return Object.fromEntries(
      questions.map((question) => {
        const value = (values[question.id] ?? "").trim()
        const words = countWords(value)
        const missingRequired = question.required && value.length === 0
        const tooShort = value.length > 0 && words < question.minWords
        return [
          question.id,
          {
            value,
            words,
            missingRequired,
            tooShort,
            isValid: !missingRequired && !tooShort,
          },
        ]
      })
    )
  }, [questions, values])

  const canSubmit =
    questions.length > 0 &&
    questions.every((question) => {
      const validation = validationMap[question.id]
      if (!validation) return false
      return !validation.missingRequired
    })

  const submit = React.useCallback(() => {
    setSubmitted(true)
    if (!canSubmit || answered) return
    addResult(buildSummary())
  }, [addResult, answered, buildSummary, canSubmit])

  if (answered || isCancelled) {
    const summary = (result as AskScaffoldBatchResult | undefined)?.answers ?? []

    return (
      <section
        data-slot="ask-scaffold-batch-tool-ui"
        className="w-full overflow-hidden rounded-2xl border bg-background"
      >
        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3.5">
            {isCancelled ? <XIcon /> : <CheckIcon />}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[13px] leading-snug text-muted-foreground">
              {context || title}
            </p>
            {summary.length > 0 ? (
              <div className="space-y-2">
                {summary.map((answer) => (
                  <div key={answer.id}>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {answer.label}
                    </p>
                    <p className="line-clamp-2 text-sm font-medium text-foreground">
                      {answer.answer}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {isCancelled ? "Skipped" : "Submitted"}
              </p>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <div data-slot="ask-scaffold-batch-tool-ui" className="w-full">
      {context && (
        <div className="mb-2.5 flex items-center gap-2 pl-0.5 text-sm text-muted-foreground">
          <SparklesIcon className="size-4 shrink-0" />
          <p>{context}</p>
        </div>
      )}

      <section
        aria-busy={isStreaming}
        className="w-full overflow-hidden rounded-2xl border bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-28px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {isStreaming ? "Preparing scaffold..." : title}
            </p>
            {questions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Fill the scaffold so the plan can be built from real context.
              </p>
            )}
          </div>
          {questions.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {activeIndex + 1} of {questions.length}
            </span>
          )}
        </div>

        {activeQuestion && (
          <div className="border-t border-border px-4 py-4">
            <div className="mb-3">
              <p className="mb-1 text-sm font-medium text-foreground">
                {activeQuestion.label}
              </p>
              <p className="text-sm leading-snug text-muted-foreground">
                {activeQuestion.question}
              </p>
              {activeQuestion.helperText && (
                <p className="mt-2 text-xs leading-snug text-muted-foreground">
                  {activeQuestion.helperText}
                </p>
              )}
            </div>

            <Textarea
              value={values[activeQuestion.id] ?? ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [activeQuestion.id]: event.target.value,
                }))
              }
              rows={5}
              placeholder={activeQuestion.placeholder}
              className="min-h-30 resize-y"
            />

            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">
                {(validationMap[activeQuestion.id]?.words ?? 0).toString()} words
                {activeQuestion.required ? ` • need ${activeQuestion.minWords}+` : ""}
              </span>
              <span
                className={cn(
                  "text-muted-foreground",
                  !validationMap[activeQuestion.id]?.missingRequired &&
                    "text-emerald-600"
                )}
              >
                {validationMap[activeQuestion.id]?.missingRequired
                  ? "Required"
                  : validationMap[activeQuestion.id]?.tooShort
                    ? "Can submit, but add detail if possible"
                    : "Ready"}
              </span>
            </div>

            {submitted && validationMap[activeQuestion.id]?.missingRequired && (
              <p className="mt-2 text-xs text-destructive">
                Please answer this field before continuing.
              </p>
            )}

            {!submitted && validationMap[activeQuestion.id]?.tooShort && (
              <p className="mt-2 text-xs text-amber-600">
                Short answers are allowed, but adding a little more detail will help the plan come out more accurate.
              </p>
            )}
          </div>
        )}

        {questions.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
              disabled={activeIndex === 0}
            >
              <ChevronLeftIcon className="size-4" />
              Back
            </Button>

            {activeIndex < questions.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setActiveIndex((current) =>
                    Math.min(questions.length - 1, current + 1)
                  )
                }
              >
                Next
                <ChevronRightIcon className="size-4" />
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={submit} disabled={!canSubmit}>
                Submit scaffold
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export function AskScaffoldTool() {
  const batchTool = React.useMemo(
    () => ({
      toolName: "askScaffoldBatch",
      description:
        "Ask the user a short batch of open-text scaffold questions with labels, placeholders, and helper prompts. " +
        "Use this for template workflows when the user must supply their own thinking before a plan is drafted. " +
        "The result returns an answers array with each scaffold field id, label, question, answer, and word count.",
      parameters: askScaffoldBatchParameters,
    }),
    []
  )

  const render = useInlineRender<
    AskScaffoldBatchArgs,
    AskScaffoldBatchResult
  >((props) => <AskScaffoldBatchCard {...props} />)

  useAssistantTool(batchTool)
  useAssistantToolUI({ toolName: "askScaffoldBatch", render })

  return null
}

export { AskScaffoldBatchCard }
export type {
  AskScaffoldBatchArgs,
  AskScaffoldBatchResult,
}
