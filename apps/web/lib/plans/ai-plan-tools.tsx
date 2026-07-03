"use client"

import * as React from "react"
import {
  type ToolCallMessagePartProps,
  useAssistantTool,
} from "@assistant-ui/react"
import { format } from "date-fns"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  FileTextIcon,
  Loader2Icon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  getPlan,
  savePlan,
  listPlans,
  type SavedPlan,
  type SavedPlanTask,
} from "@/lib/plans/plan-repository"
import { buildAskHref } from "@/lib/routing/ask-url"
import { getExe101FallbackTemplate } from "@/lib/templates/exe101-fallback"

export const AI_PLAN_REWRITE_EVENT = "lockin:ai-plan-rewritten"

type PlanToolTaskInput = {
  title?: string
  description?: string
  dueDate?: string
  durationMinutes?: number
  isCompleted?: boolean
  guidance?: string | null
  parentId?: string | null
}

type PlanToolInput = {
  title?: string
  description?: string
  completion?: string
  tasks?: PlanToolTaskInput[]
  templateId?: string | null
  rubricNotes?: string | null
  draftReference?: string | null
  experienceLevel?: "FIRST_TIME" | "EXPERIENCED" | null
}

type PlanToolResult =
  | {
      ok: true
      planId: string
      chatSessionId?: string
      title: string
      taskCount: number
      taskTitles: string[]
      confirmation: string
    }
  | {
      ok: false
      reason: string
    }

const taskInputSchema = {
  type: "object" as const,
  properties: {
    title: {
      type: "string" as const,
      description: "Short action-oriented task title.",
    },
    description: {
      type: "string" as const,
      description: "Optional context or acceptance criteria for the task.",
    },
    dueDate: {
      type: "string" as const,
      description: "Optional due date in yyyy-MM-dd format.",
    },
    durationMinutes: {
      type: "number" as const,
      description: "Estimated task duration in minutes.",
    },
    isCompleted: {
      type: "boolean" as const,
      description: "Whether this task is already complete.",
    },
    guidance: {
      type: "string" as const,
      description:
        "Short how-to guidance for this step. Include actionable instructions, not theory.",
    },
    parentId: {
      type: "string" as const,
      description: "Optional parent step id when this item is a sub-step.",
    },
  },
  required: ["title"],
}

const planInputSchema = {
  type: "object" as const,
  properties: {
    title: {
      type: "string" as const,
      description: "Concise name for the plan.",
    },
    description: {
      type: "string" as const,
      description: "Brief summary of what the plan accomplishes.",
    },
    completion: {
      type: "string" as const,
      description: "Definition of done or desired end state.",
    },
    tasks: {
      type: "array" as const,
      description: "Ordered list of concrete steps in the plan.",
      items: taskInputSchema,
    },
    templateId: {
      type: "string" as const,
      description:
        "Workflow template id when the plan is grounded on a selected template.",
    },
    rubricNotes: {
      type: "string" as const,
      description:
        "Rubric or grading constraints that the plan should follow if the user supplied them.",
    },
    draftReference: {
      type: "string" as const,
      description:
        "Summary of the user's existing draft or outline if the plan is based on revising existing work.",
    },
    experienceLevel: {
      type: "string" as const,
      enum: ["FIRST_TIME", "EXPERIENCED"],
      description:
        "Use FIRST_TIME for highly guided plans and EXPERIENCED for leaner plans.",
    },
  },
  required: ["title", "description", "completion", "tasks"],
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function today() {
  return format(new Date(), "yyyy-MM-dd")
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ""
}

function normalizeDueDate(value: string | undefined) {
  const trimmed = normalizeText(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : today()
}

function normalizeDuration(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 30
  }

  return Math.round(value)
}

function normalizeTasks(tasks: PlanToolTaskInput[] | undefined) {
  return (tasks ?? [])
    .filter(
      (task) =>
        normalizeText(task.title).length > 0 ||
        normalizeText(task.description).length > 0
    )
    .map<SavedPlanTask>((task) => ({
      id: createId(),
      title: normalizeText(task.title),
      description: normalizeText(task.description),
      dueDate: normalizeDueDate(task.dueDate),
      durationMinutes: normalizeDuration(task.durationMinutes),
      isCompleted: task.isCompleted ?? false,
      guidance: normalizeText(task.guidance) || null,
      parentId: normalizeText(task.parentId) || null,
    }))
}

function buildPlan(input: PlanToolInput, existingPlan?: SavedPlan): SavedPlan {
  const now = new Date().toISOString()

  return {
    id: existingPlan?.id ?? createId(),
    title: normalizeText(input.title),
    description: normalizeText(input.description),
    completion: normalizeText(input.completion),
    tasks: normalizeTasks(input.tasks),
    createdAt: existingPlan?.createdAt ?? now,
    updatedAt: now,
    version: 1,
    templateId:
      input.templateId !== undefined
        ? normalizeText(input.templateId) || null
        : existingPlan?.templateId ?? null,
    rubricNotes:
      input.rubricNotes !== undefined
        ? normalizeText(input.rubricNotes) || null
        : existingPlan?.rubricNotes ?? null,
    draftReference:
      input.draftReference !== undefined
        ? normalizeText(input.draftReference) || null
        : existingPlan?.draftReference ?? null,
    experienceLevel:
      input.experienceLevel !== undefined
        ? input.experienceLevel
        : existingPlan?.experienceLevel ?? null,
  }
}

function getTaskTitles(tasks: SavedPlanTask[]) {
  return tasks
    .map((task) => task.title.trim())
    .filter(Boolean)
    .slice(0, 3)
}

function hasThinkExecuteReviewShape(tasks: SavedPlanTask[]) {
  const titles = tasks.map((task) => task.title.toLowerCase())

  const hasThinking = titles.some((title) =>
    /(thinking|suy nghi|research|clarify|plan)/i.test(title)
  )
  const hasExecution = titles.some((title) =>
    /(execution|thuc thi|draft|build|write|analy|design|model|prepare)/i.test(
      title
    )
  )
  const hasReview = titles.some((title) =>
    /(review|tong ket|check|revise|final|submit|rehearse|validate)/i.test(title)
  )

  return hasThinking && hasExecution && hasReview
}

function normalizeTemplateIdForPersistence(templateId: string | null | undefined) {
  if (!templateId) return null
  return getExe101FallbackTemplate(templateId) ? null : templateId
}

function formatStepCount(count: number) {
  return `${count} ${count === 1 ? "step" : "steps"}`
}

function getPlanConfirmation(
  action: "created" | "updated",
  title: string,
  taskCount: number
) {
  return `Done - I ${action} "${title}" with ${formatStepCount(taskCount)}.`
}

function isPlanToolResult(value: unknown): value is PlanToolResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof value.ok === "boolean"
  )
}

const planToolCopy = {
  create: {
    running: "Creating plan...",
    success: "Created",
    failure: "Could not create plan",
  },
  rewrite: {
    running: "Updating plan...",
    success: "Updated",
    failure: "Could not update plan",
  },
} as const

type PlanToolCardProps = {
  action: keyof typeof planToolCopy
  chatSessionId: string | null
} & ToolCallMessagePartProps<PlanToolInput, PlanToolResult>

function PlanToolResultCard({
  action,
  args,
  chatSessionId,
  isError,
  result,
  status,
}: PlanToolCardProps) {
  const copy = planToolCopy[action]
  const isRunning = status?.type === "running"
  const toolResult = isPlanToolResult(result) ? result : undefined
  const successResult = toolResult?.ok ? toolResult : undefined
  const failed =
    isError ||
    status?.type === "incomplete" ||
    (toolResult ? !toolResult.ok : false)
  const title = successResult
    ? successResult.title
    : normalizeText(args.title) || "New plan"
  const taskCount = successResult
    ? successResult.taskCount
    : (args.tasks?.filter((task) => normalizeText(task.title).length > 0)
        .length ?? 0)
  const taskTitles = successResult
    ? successResult.taskTitles
    : (args.tasks ?? [])
        .map((task) => normalizeText(task.title))
        .filter(Boolean)
        .slice(0, 3)

  const reason =
    toolResult && !toolResult.ok
      ? toolResult.reason
      : status?.type === "incomplete" && status.error
        ? String(status.error)
        : "Something interrupted the plan update. Try again when you are ready."
  const [fallbackPlanId, setFallbackPlanId] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    if (successResult || failed || isRunning) {
      setFallbackPlanId(null)
      return
    }

    let isActive = true

    listPlans()
      .then((plans) => {
        if (!isActive) return

        const matchingPlan = plans.find(
          (plan) => plan.title === title && plan.taskCount === taskCount
        )
        setFallbackPlanId(matchingPlan?.id ?? null)
      })
      .catch(() => {
        if (isActive) {
          setFallbackPlanId(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [failed, isRunning, successResult, taskCount, title])

  const resolvedPeekViewHref =
    successResult || fallbackPlanId
      ? buildAskHref({
          planId: successResult?.planId ?? fallbackPlanId ?? undefined,
          chatSessionId:
            successResult?.chatSessionId ?? chatSessionId ?? undefined,
        })
      : undefined

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border bg-background",
        failed && "border-destructive/30 bg-destructive/5"
      )}
    >
      <div className="flex flex-row justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              {isRunning ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : failed ? (
                <AlertCircleIcon className="size-4 text-destructive" />
              ) : (
                <CheckCircle2Icon className="size-4 text-emerald-600" />
              )}
              <span className="text-xs font-medium uppercase">
                {isRunning ? copy.running : failed ? copy.failure : "All set"}
              </span>
            </div>

            <p className="text-base leading-snug font-medium text-foreground">
              {isRunning ? (
                copy.running
              ) : failed ? (
                reason
              ) : (
                <>
                  {copy.success} <span>&ldquo;{title}&rdquo;</span> plan
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!failed && !isRunning && resolvedPeekViewHref && (
              <Link
                className={cn(buttonVariants({ size: "sm" }))}
                href={resolvedPeekViewHref}
              >
                <span>Open plan</span>
              </Link>
            )}
          </div>
        </div>

        <PlanPreview title={title} taskCount={taskCount} tasks={taskTitles} />
      </div>
    </div>
  )
}

function PlanPreview({
  title,
  taskCount,
  tasks,
}: {
  title: string
  taskCount: number
  tasks: string[]
}) {
  const previewLines = tasks.length > 0 ? tasks : ["First step", "Next step"]

  return (
    <div className="min-h-[calc(100% - 4rem)] max-w-48 shrink-0 rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <FileTextIcon className="size-4 text-muted-foreground" />
        <span className="line-clamp-1 text-sm font-medium">{title}</span>
      </div>
      <div className="mb-3 text-xs text-muted-foreground">
        {taskCount} {taskCount === 1 ? "step" : "steps"}
      </div>
      <div className="space-y-2">
        {previewLines.slice(0, 3).map((task, index) => (
          <div key={`${task}-${index}`} className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
            <span
              className={cn(
                "h-1.5 rounded-full bg-muted",
                index === 0 && "w-32",
                index === 1 && "w-24",
                index === 2 && "w-28"
              )}
            />
            <span className="sr-only">{task}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PlanAssistantTools({
  chatSessionId: propChatSessionId,
  ensureChatId,
}: {
  chatSessionId?: string
  ensureChatId?: () => Promise<string>
} = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activePlanId =
    searchParams.get("p") ??
    (pathname === "/app/plan" ? searchParams.get("id") : null)
  const selectedTemplateId = searchParams.get("template")
  const urlChatSessionId =
    pathname === "/app/ask"
      ? searchParams.get("id") ?? searchParams.get("t")
      : searchParams.get("chatSessionId") ?? searchParams.get("t")
  const chatSessionId = propChatSessionId ?? urlChatSessionId

  const createPlanTool = React.useMemo(
    () => ({
      toolName: "createPlan",
      description:
        "Create and save a new LockIn plan, then open it in the plan editor.",
      parameters: planInputSchema,
      execute: async (input: PlanToolInput): Promise<PlanToolResult> => {
        const resolvedInput: PlanToolInput = {
          ...input,
          templateId: normalizeTemplateIdForPersistence(
            input.templateId ?? selectedTemplateId ?? null
          ),
        }
        const plan = {
          ...buildPlan(resolvedInput),
          source: "AI" as const,
          aiMode: "ASSISTED" as const,
        }

        if (
          plan.templateId &&
          (!plan.tasks.some((task) => task.guidance?.trim()) ||
            !hasThinkExecuteReviewShape(plan.tasks))
        ) {
          return {
            ok: false,
            reason:
              "Template-based plans must include guided steps across Thinking, Execution, and Review stages before they can be saved.",
          }
        }

        await savePlan(plan)

        // Ensure we have a chat ID before navigating — create one if needed
        const resolvedChatId =
          chatSessionId ?? (ensureChatId ? await ensureChatId() : null)

        router.push(
          buildAskHref({
            chatSessionId: resolvedChatId ?? undefined,
            planId: plan.id,
          })
        )

        return {
          ok: true,
          planId: plan.id,
          chatSessionId: resolvedChatId ?? undefined,
          title: plan.title,
          taskCount: plan.tasks.length,
          taskTitles: getTaskTitles(plan.tasks),
          confirmation: getPlanConfirmation(
            "created",
            plan.title,
            plan.tasks.length
          ),
        }
      },
      render: (
        props: ToolCallMessagePartProps<PlanToolInput, PlanToolResult>
      ) => (
        <PlanToolResultCard
          {...props}
          action="create"
          chatSessionId={chatSessionId ?? null}
        />
      ),
    }),
    [chatSessionId, ensureChatId, router, selectedTemplateId]
  )

  const rewriteActivePlanTool = React.useMemo(
    () => ({
      toolName: "rewriteActivePlan",
      description:
        "Replace the currently open LockIn plan with a rewritten title, description, completion, and task list.",
      parameters: planInputSchema,
      execute: async (input: PlanToolInput): Promise<PlanToolResult> => {
        if (!activePlanId) {
          return {
            ok: false,
            reason:
              "No active plan is open. Ask the user to open or create a plan first.",
          }
        }

        const existingPlan = await getPlan(activePlanId)

        if (!existingPlan) {
          return {
            ok: false,
            reason:
              "The active plan could not be found. Ask the user to open or create a plan first.",
          }
        }

        const plan = {
          ...buildPlan(input, existingPlan),
          source: existingPlan.source,
          aiMode: "ASSISTED" as const,
        }

        if (
          plan.templateId &&
          (!plan.tasks.some((task) => task.guidance?.trim()) ||
            !hasThinkExecuteReviewShape(plan.tasks))
        ) {
          return {
            ok: false,
            reason:
              "Template-based plans must keep guided Thinking, Execution, and Review stages.",
          }
        }
        await savePlan(plan)
        window.dispatchEvent(
          new CustomEvent(AI_PLAN_REWRITE_EVENT, {
            detail: { planId: plan.id },
          })
        )

        return {
          ok: true,
          planId: plan.id,
          chatSessionId: chatSessionId ?? undefined,
          title: plan.title,
          taskCount: plan.tasks.length,
          taskTitles: getTaskTitles(plan.tasks),
          confirmation: getPlanConfirmation(
            "updated",
            plan.title,
            plan.tasks.length
          ),
        }
      },
      render: (
        props: ToolCallMessagePartProps<PlanToolInput, PlanToolResult>
      ) => (
        <PlanToolResultCard
          {...props}
          action="rewrite"
          chatSessionId={chatSessionId ?? null}
        />
      ),
    }),
    [activePlanId, chatSessionId]
  )

  useAssistantTool(createPlanTool)
  useAssistantTool(rewriteActivePlanTool)

  return null
}
