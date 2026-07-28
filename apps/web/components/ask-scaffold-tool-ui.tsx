"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  type ToolCallMessagePartProps,
  useAssistantTool,
  useAssistantToolUI,
  useInlineRender,
} from "@assistant-ui/react"
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

type AskScaffoldOptionInput = {
  label?: string
  description?: string
}

type AskScaffoldQuestionInput = {
  id?: string
  label?: string
  question?: string
  placeholder?: string
  helperText?: string
  options?: AskScaffoldOptionInput[]
  allowOther?: boolean
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

type SelectPlanTaskInput = {
  id?: string
  title?: string
  description?: string
  durationMinutes?: number
  recommended?: boolean
  guidance?: string
}

type SelectPlanTasksArgs = {
  context?: string
  title?: string
  question?: string
  tasks?: SelectPlanTaskInput[]
  suggestedTasks?: SelectPlanTaskInput[]
  allowCustom?: boolean
  minSelected?: number
}

type SelectPlanTasksResult = {
  selectedTasks: Array<{
    id: string
    title: string
    description?: string
    durationMinutes?: number
    guidance?: string
    isCustom?: boolean
  }>
  rejectedTasks: Array<{
    id: string
    title: string
  }>
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
        "Two to five scaffold questions that gather planning context from the user. Prefer multiple-choice options with an optional custom answer over open text.",
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
            description:
              "Optional hint that nudges the user toward a better answer.",
          },
          options: {
            type: "array" as const,
            description:
              "Recommended answer choices. Use 2-6 options whenever possible so the user can tap instead of typing.",
            items: {
              type: "object" as const,
              properties: {
                label: {
                  type: "string" as const,
                  description: "Short answer option.",
                },
                description: {
                  type: "string" as const,
                  description: "Optional short explanation for this option.",
                },
              },
              required: ["label"],
            },
          },
          allowOther: {
            type: "boolean" as const,
            description:
              "Whether to include an Other field for custom input. Defaults to true when options are present.",
          },
          required: {
            type: "boolean" as const,
            description:
              "Whether this field must be answered before submission. Defaults to true.",
          },
          minWords: {
            type: "number" as const,
            description:
              "Minimum suggested word count before the answer is considered complete. Defaults to 12.",
          },
        },
        required: ["id", "label", "question"],
      },
    },
  },
  required: ["questions"],
}

const selectPlanTasksParameters = {
  type: "object" as const,
  properties: {
    context: {
      type: "string" as const,
      description:
        "Optional short explanation for why the user should review these tasks.",
    },
    title: {
      type: "string" as const,
      description: "Short title for the task selection card.",
    },
    question: {
      type: "string" as const,
      description: "Main question shown above the recommended task list.",
    },
    tasks: {
      type: "array" as const,
      description:
        "Recommended default tasks that should be preselected for the final plan.",
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          title: { type: "string" as const },
          description: { type: "string" as const },
          durationMinutes: { type: "number" as const },
          recommended: { type: "boolean" as const },
          guidance: { type: "string" as const },
        },
        required: ["title"],
      },
    },
    suggestedTasks: {
      type: "array" as const,
      description:
        "Optional extra steps the user may add if relevant. These should start unchecked.",
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          title: { type: "string" as const },
          description: { type: "string" as const },
          durationMinutes: { type: "number" as const },
          guidance: { type: "string" as const },
        },
        required: ["title"],
      },
    },
    allowCustom: {
      type: "boolean" as const,
      description:
        "Whether the user can type additional tasks. Defaults to true.",
    },
    minSelected: {
      type: "number" as const,
      description: "Minimum tasks required before submission. Defaults to 1.",
    },
  },
  required: ["tasks"],
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
  options: Array<{ label: string; description?: string }>
  allowOther: boolean
  required: boolean
  minWords: number
}

type NormalizedPlanTask = {
  id: string
  title: string
  description?: string
  durationMinutes?: number
  guidance?: string
  recommended: boolean
}

function normalizeOptions(
  options: AskScaffoldQuestionInput["options"]
): NormalizedScaffoldQuestion["options"] {
  if (!Array.isArray(options)) return []

  return options.slice(0, 6).flatMap((option) => {
    if (!isRecord(option)) return []
    const label = typeof option.label === "string" ? option.label.trim() : ""
    if (!label) return []
    return [
      {
        label,
        description:
          typeof option.description === "string"
            ? option.description.trim()
            : undefined,
      },
    ]
  })
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
        options: normalizeOptions(question.options),
        allowOther: question.allowOther !== false,
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

function normalizePlanTasks(
  tasks: SelectPlanTaskInput[] | undefined,
  fallbackPrefix: string,
  recommended: boolean
): NormalizedPlanTask[] {
  if (!Array.isArray(tasks)) return []

  return tasks.slice(0, 12).flatMap((task, index) => {
    if (!isRecord(task)) return []

    const title = typeof task.title === "string" ? task.title.trim() : ""
    if (!title) return []

    const id =
      typeof task.id === "string" && task.id.trim()
        ? task.id.trim()
        : `${fallbackPrefix}-${index + 1}`
    const durationMinutes =
      typeof task.durationMinutes === "number" &&
      Number.isFinite(task.durationMinutes) &&
      task.durationMinutes > 0
        ? Math.round(task.durationMinutes)
        : undefined

    return [
      {
        id,
        title,
        description:
          typeof task.description === "string"
            ? task.description.trim()
            : undefined,
        durationMinutes,
        guidance:
          typeof task.guidance === "string" ? task.guidance.trim() : undefined,
        recommended: task.recommended !== false && recommended,
      },
    ]
  })
}

function parseSelectPlanTasksArgs(
  args: SelectPlanTasksArgs,
  argsText: string | undefined
): SelectPlanTasksArgs {
  if (isRecord(args) && args.tasks) return args
  if (!argsText) return args ?? {}
  try {
    const parsed = JSON.parse(argsText)
    return isRecord(parsed) ? (parsed as SelectPlanTasksArgs) : (args ?? {})
  } catch {
    return args ?? {}
  }
}

function AskScaffoldBatchCard({
  args,
  argsText,
  status,
  result,
  addResult,
}: ToolCallMessagePartProps<AskScaffoldBatchArgs, AskScaffoldBatchResult>) {
  const { t } = useTranslation()
  const resolved = parseArgs(isRecord(args) ? args : {}, argsText)
  const questions = normalizeQuestions(resolved.questions)
  const context = resolved.context?.trim()
  const title =
    resolved.title?.trim() ||
    t("app.aiTools.planningScaffold", { defaultValue: "Planning scaffold" })
  const isStreaming = status.type === "running" && questions.length === 0
  const isCancelled = status.type === "incomplete"
  const answered = result !== undefined && result !== null
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [customOpen, setCustomOpen] = React.useState<Record<string, boolean>>(
    {}
  )
  const [submitted, setSubmitted] = React.useState(false)

  React.useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(questions.length - 1, 0))
    )
  }, [questions.length])

  const activeQuestion = questions[activeIndex]
  const activeValue = activeQuestion ? (values[activeQuestion.id] ?? "") : ""
  const activeCustomOpen = activeQuestion
    ? (customOpen[activeQuestion.id] ?? false)
    : false
  const activeUsesOptions =
    activeQuestion !== undefined && activeQuestion.options.length > 0

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
        const tooShort =
          question.options.length === 0 &&
          value.length > 0 &&
          words < question.minWords
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

  const setQuestionValue = React.useCallback(
    (questionId: string, value: string) => {
      setValues((current) => ({
        ...current,
        [questionId]: value,
      }))
    },
    []
  )

  const chooseOption = React.useCallback(
    (question: NormalizedScaffoldQuestion, optionIndex: number) => {
      setCustomOpen((current) => ({ ...current, [question.id]: false }))
      setQuestionValue(question.id, question.options[optionIndex]!.label)
    },
    [setQuestionValue]
  )

  if (answered || isCancelled) {
    const summary =
      (result as AskScaffoldBatchResult | undefined)?.answers ?? []

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
                {isCancelled
                  ? t("app.aiTools.skipped", { defaultValue: "Skipped" })
                  : t("app.aiTools.submitted", { defaultValue: "Submitted" })}
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
              {isStreaming
                ? t("app.aiTools.preparingScaffold", {
                    defaultValue: "Preparing scaffold...",
                  })
                : title}
            </p>
            {questions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("app.aiTools.scaffoldHint", {
                  defaultValue:
                    "Fill the scaffold so the plan can be built from real context.",
                })}
              </p>
            )}
          </div>
          {questions.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {activeIndex + 1} {t("app.aiTools.of", { defaultValue: "of" })}{" "}
              {questions.length}
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

            {activeUsesOptions ? (
              <div className="flex flex-col overflow-hidden rounded-xl border border-border">
                {activeQuestion.options.map((option, optionIndex) => {
                  const isSelected =
                    activeValue === option.label && !activeCustomOpen

                  return (
                    <button
                      key={`${activeQuestion.id}-${option.label}-${optionIndex}`}
                      type="button"
                      onClick={() => chooseOption(activeQuestion, optionIndex)}
                      className={cn(
                        "group flex w-full items-center gap-4 border-t border-border px-4 py-3.5 text-left transition-colors first:border-t-0",
                        "hover:bg-muted active:translate-y-px",
                        isSelected && "bg-primary/10"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border bg-muted text-[13px] text-muted-foreground transition-colors",
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
                        <span className="block font-medium">
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
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
                      "flex items-center gap-3 border-t border-border px-4 py-3 transition-colors",
                      activeCustomOpen && "bg-muted"
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
                        activeCustomOpen &&
                          "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      <PlusIcon />
                    </button>
                    <Input
                      value={activeCustomOpen ? activeValue : ""}
                      onFocus={() =>
                        setCustomOpen((current) => ({
                          ...current,
                          [activeQuestion.id]: true,
                        }))
                      }
                      onChange={(event) =>
                        setQuestionValue(activeQuestion.id, event.target.value)
                      }
                      placeholder={t("app.aiTools.somethingElse", {
                        defaultValue: "Something else...",
                      })}
                      className="border-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                value={values[activeQuestion.id] ?? ""}
                onChange={(event) =>
                  setQuestionValue(activeQuestion.id, event.target.value)
                }
                rows={5}
                placeholder={activeQuestion.placeholder}
                className="min-h-30 resize-y"
              />
            )}

            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">
                {activeUsesOptions
                  ? activeValue
                    ? t("app.aiTools.optionSelected", {
                        defaultValue: "Option selected",
                      })
                    : t("app.aiTools.chooseOption", {
                        defaultValue: "Choose one option",
                      })
                  : t("app.aiTools.wordCount", {
                      count: validationMap[activeQuestion.id]?.words ?? 0,
                      defaultValue: `${validationMap[activeQuestion.id]?.words ?? 0} words`,
                    })}
                {!activeUsesOptions && activeQuestion.required
                  ? ` • ${t("app.aiTools.needWords", {
                      count: activeQuestion.minWords,
                      defaultValue: `need ${activeQuestion.minWords}+`,
                    })}`
                  : ""}
              </span>
              <span
                className={cn(
                  "text-muted-foreground",
                  !validationMap[activeQuestion.id]?.missingRequired &&
                    "text-emerald-600"
                )}
              >
                {validationMap[activeQuestion.id]?.missingRequired
                  ? t("app.aiTools.required", { defaultValue: "Required" })
                  : validationMap[activeQuestion.id]?.tooShort
                    ? t("app.aiTools.canSubmitAddDetail", {
                        defaultValue: "Can submit, but add detail if possible",
                      })
                    : t("app.aiTools.ready", { defaultValue: "Ready" })}
              </span>
            </div>

            {submitted && validationMap[activeQuestion.id]?.missingRequired && (
              <p className="mt-2 text-xs text-destructive">
                {t("app.aiTools.answerRequired", {
                  defaultValue: "Please answer this field before continuing.",
                })}
              </p>
            )}

            {!submitted && validationMap[activeQuestion.id]?.tooShort && (
              <p className="mt-2 text-xs text-amber-600">
                {t("app.aiTools.shortAnswerHint", {
                  defaultValue:
                    "Short answers are allowed, but adding a little more detail will help the plan come out more accurate.",
                })}
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
              onClick={() =>
                setActiveIndex((current) => Math.max(0, current - 1))
              }
              disabled={activeIndex === 0}
            >
              <ChevronLeftIcon className="size-4" />
              {t("app.aiTools.back", { defaultValue: "Back" })}
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
                {t("app.aiTools.next", { defaultValue: "Next" })}
                <ChevronRightIcon className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={submit}
                disabled={!canSubmit}
              >
                {t("app.aiTools.submitScaffold", {
                  defaultValue: "Submit scaffold",
                })}
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function SelectPlanTasksCard({
  args,
  argsText,
  status,
  result,
  addResult,
}: ToolCallMessagePartProps<SelectPlanTasksArgs, SelectPlanTasksResult>) {
  const { t } = useTranslation()
  const resolved = parseSelectPlanTasksArgs(
    isRecord(args) ? args : {},
    argsText
  )
  const defaultTasks = normalizePlanTasks(resolved.tasks, "task", true)
  const suggestedTasks = normalizePlanTasks(
    resolved.suggestedTasks,
    "suggested-task",
    false
  )
  const tasks = React.useMemo(
    () => [...defaultTasks, ...suggestedTasks],
    [defaultTasks, suggestedTasks]
  )
  const context = resolved.context?.trim()
  const title =
    resolved.title?.trim() ||
    t("app.aiTools.reviewPlanTasks", {
      defaultValue: "Review plan tasks",
    })
  const question =
    resolved.question?.trim() ||
    t("app.aiTools.choosePlanTasks", {
      defaultValue: "Choose the tasks you want in the final plan.",
    })
  const isStreaming = status.type === "running" && tasks.length === 0
  const isCancelled = status.type === "incomplete"
  const answered = result !== undefined && result !== null
  const allowCustom = resolved.allowCustom !== false
  const minSelected =
    typeof resolved.minSelected === "number" && resolved.minSelected > 0
      ? Math.round(resolved.minSelected)
      : 1

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(defaultTasks.map((task) => task.id))
  )
  const [customTasks, setCustomTasks] = React.useState<string[]>([])
  const [customValue, setCustomValue] = React.useState("")
  const defaultTaskIdsKey = defaultTasks.map((task) => task.id).join("\n")
  const selectedCount = selectedIds.size + customTasks.length
  const canSubmit = selectedCount >= minSelected

  React.useEffect(() => {
    if (!defaultTaskIdsKey) return
    setSelectedIds((current) =>
      current.size > 0 ? current : new Set(defaultTasks.map((task) => task.id))
    )
  }, [defaultTaskIdsKey, defaultTasks])

  const toggleTask = (taskId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(taskId)
      } else {
        next.delete(taskId)
      }
      return next
    })
  }

  const addCustomTask = () => {
    const value = customValue.trim()
    if (!value) return
    setCustomTasks((current) => [...current, value])
    setCustomValue("")
  }

  const submit = () => {
    if (!canSubmit || answered) return

    const selectedTasks = [
      ...tasks
        .filter((task) => selectedIds.has(task.id))
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          durationMinutes: task.durationMinutes,
          guidance: task.guidance,
        })),
      ...customTasks.map((title, index) => ({
        id: `custom-task-${index + 1}`,
        title,
        isCustom: true,
      })),
    ]

    addResult({
      selectedTasks,
      rejectedTasks: tasks
        .filter((task) => !selectedIds.has(task.id))
        .map((task) => ({ id: task.id, title: task.title })),
    })
  }

  if (answered || isCancelled) {
    const summary =
      (result as SelectPlanTasksResult | undefined)?.selectedTasks ?? []

    return (
      <section
        data-slot="select-plan-tasks-tool-ui"
        className="w-full overflow-hidden rounded-2xl border bg-background"
      >
        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3.5">
            {isCancelled ? <XIcon /> : <CheckIcon />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-snug text-muted-foreground">
              {title}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {isCancelled
                ? t("app.aiTools.skipped", { defaultValue: "Skipped" })
                : t("app.aiTools.tasksSelected", {
                    count: summary.length,
                    defaultValue: `${summary.length} tasks selected`,
                  })}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div data-slot="select-plan-tasks-tool-ui" className="w-full">
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
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            {isStreaming
              ? t("app.aiTools.preparingTasks", {
                  defaultValue: "Preparing tasks...",
                })
              : title}
          </p>
          <p className="text-xs text-muted-foreground">{question}</p>
        </div>

        {tasks.length > 0 && (
          <div className="border-t border-border">
            {tasks.map((task) => {
              const checked = selectedIds.has(task.id)

              return (
                <label
                  key={task.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 border-t border-border px-4 py-3 first:border-t-0 transition-colors hover:bg-muted",
                    checked && "bg-primary/10"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggleTask(task.id, Boolean(value))
                    }
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {task.title}
                    </span>
                    {(task.description || task.durationMinutes) && (
                      <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                        {[task.description, task.durationMinutes ? `${task.durationMinutes} min` : ""]
                          .filter(Boolean)
                          .join(" - ")}
                      </span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        )}

        {allowCustom && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Input
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addCustomTask()
                  }
                }}
                placeholder={t("app.aiTools.addAnotherTask", {
                  defaultValue: "Add another step...",
                })}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomTask}
                disabled={!customValue.trim()}
                aria-label={t("app.aiTools.addTask", {
                  defaultValue: "Add task",
                })}
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
            {customTasks.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {customTasks.map((task, index) => (
                  <div
                    key={`${task}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{task}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomTasks((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                      className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground [&_svg]:size-3.5"
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {t("app.aiTools.selectedTaskCount", {
              count: selectedCount,
              defaultValue: `${selectedCount} selected`,
            })}
          </p>
          <Button type="button" size="sm" onClick={submit} disabled={!canSubmit}>
            {t("app.aiTools.useSelectedTasks", {
              defaultValue: "Use selected tasks",
            })}
          </Button>
        </div>
      </section>
    </div>
  )
}

export function AskScaffoldTool() {
  const batchTool = React.useMemo(
    () => ({
      toolName: "askScaffoldBatch",
      description:
        "Ask the user a short batch of scaffold questions with labels, helper prompts, and preferred multiple-choice options plus an Other field. " +
        "Use this for planning workflows when the user should tap likely answers instead of typing from scratch. " +
        "The result returns an answers array with each scaffold field id, label, question, answer, and word count.",
      parameters: askScaffoldBatchParameters,
    }),
    []
  )
  const taskSelectionTool = React.useMemo(
    () => ({
      toolName: "selectPlanTasks",
      description:
        "Let the user review recommended default plan tasks, opt into suggested extra tasks, and add custom tasks before the final plan is saved.",
      parameters: selectPlanTasksParameters,
    }),
    []
  )

  const render = useInlineRender<AskScaffoldBatchArgs, AskScaffoldBatchResult>(
    (props) => <AskScaffoldBatchCard {...props} />
  )
  const renderTaskSelection = useInlineRender<
    SelectPlanTasksArgs,
    SelectPlanTasksResult
  >((props) => <SelectPlanTasksCard {...props} />)

  useAssistantTool(batchTool)
  useAssistantTool(taskSelectionTool)
  useAssistantToolUI({ toolName: "askScaffoldBatch", render })
  useAssistantToolUI({
    toolName: "selectPlanTasks",
    render: renderTaskSelection,
  })

  return null
}

export { AskScaffoldBatchCard, SelectPlanTasksCard }
export type {
  AskScaffoldBatchArgs,
  AskScaffoldBatchResult,
  SelectPlanTasksArgs,
  SelectPlanTasksResult,
}
