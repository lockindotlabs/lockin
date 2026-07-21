"use client"

import * as React from "react"
import { format } from "date-fns"
import { CloudCheckIcon, ListTodoIcon, Loader2 } from "lucide-react"
import { NavActions } from "@/components/nav-actions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Textarea } from "@workspace/ui/components/textarea"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import PlanDetails from "./PlanDetails"
import TaskList from "./TaskList"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { AiPlannerIcon } from "@/components/icons"
import {
  deletePlan,
  getPlan,
  savePlan,
  type SavedPlan,
  type SavedPlanTask,
} from "@/lib/plans/plan-repository"
import { markPlanOpened } from "@/lib/plans/recently-opened-plans"
import { AI_PLAN_REWRITE_EVENT } from "@/lib/plans/ai-plan-tools"
import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { HeaderLeft, HeaderRight } from "@/components/header-context"
import { cn } from "@/lib/utils"
import { Asterisk01 } from "@untitledui/icons"
import { PublishPlanAsTemplateDialog } from "@/components/templates/PublishPlanAsTemplateDialog"

type PlanEditorProps = {
  planId: string
}

type EditorPlan = {
  savedTitle: string
  savedDescription: string
  savedCompletion: string
}

export type EditorTask = {
  id: string
  savedTitle: string
  savedDescription: string
  dueDate: string
  durationMinutes: number
  isCompleted: boolean
  guidance?: string | null
  parentId?: string | null
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createEmptyPlan() {
  return {
    savedTitle: "",
    savedDescription: "",
    savedCompletion: "",
  }
}

function createTask(
  title: string,
  description: string,
  dueDate: string,
  durationMinutes: number,
  parentId: string | null = null
): EditorTask {
  return {
    id: createId(),
    savedTitle: title,
    savedDescription: description,
    dueDate,
    durationMinutes,
    isCompleted: false,
    parentId,
  }
}

function toEditorTask(task: SavedPlanTask): EditorTask {
  return {
    id: task.id,
    savedTitle: task.title,
    savedDescription: task.description,
    dueDate: task.dueDate,
    durationMinutes: task.durationMinutes,
    isCompleted: task.isCompleted,
    guidance: task.guidance ?? null,
    parentId: task.parentId ?? null,
  }
}

function isMeaningfulDraft(plan: EditorPlan, tasks: EditorTask[]) {
  return (
    plan.savedTitle.trim().length > 0 ||
    plan.savedDescription.trim().length > 0 ||
    plan.savedCompletion.trim().length > 0 ||
    tasks.length > 0
  )
}

function PlanEditorLoadingState({ state }: { state: string }) {
  return (
    <div className="flex h-[calc(100vh-1rem)]" data-plan-id="loading">
      <div className="flex-1">
        <header className="flex h-12 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <Skeleton className="mr-2 h-4 w-px" />
            <Skeleton className="mr-2 h-4 w-px" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 px-3">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </header>

        <ScrollArea className="relative flex h-[calc(100vh-3.5rem)] flex-col px-8 pt-6">
          <section className="mx-auto w-full max-w-3xl pb-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-3/4 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-4 py-2">
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="h-4 w-48 rounded-full" />
              </div>
              <div className="flex items-center gap-4 py-2">
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
              <div className="flex items-start gap-4 py-2">
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            </div>
          </section>
        </ScrollArea>
      </div>
    </div>
  )
}

export default function PlanEditor({ planId }: PlanEditorProps) {
  const router = useRouter()
  const { toggleSidebarRight, openRight } = useSidebar()
  const { state } = useSidebar()
  const [persisted, setPersisted] = React.useState<EditorTask[]>([])
  const [completionGate, setCompletionGate] = React.useState<{
    index: number
    stepId: string
  } | null>(null)
  const [reflectionNote, setReflectionNote] = React.useState("")
  const [persistedPlan, setPersistedPlan] =
    React.useState<EditorPlan>(createEmptyPlan)
  const [createdAt, setCreatedAt] = React.useState(() =>
    new Date().toISOString()
  )
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null)
  const [hasSavedPlan, setHasSavedPlan] = React.useState(false)
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [isPlanLoaded, setIsPlanLoaded] = React.useState(false)
  const [saveRevision, setSaveRevision] = React.useState(0)
  // Blocks the debounced autosave once deletion starts — an in-flight save
  // would otherwise recreate the plan (upsert clears deletedAt).
  const isDeletingPlanRef = React.useRef(false)

  const applySavedPlan = React.useCallback((savedPlan: SavedPlan | null) => {
    if (!savedPlan) {
      return
    }

    setPersistedPlan({
      savedTitle: savedPlan.title,
      savedDescription: savedPlan.description,
      savedCompletion: savedPlan.completion,
    })
    setPersisted(savedPlan.tasks.map(toEditorTask))
    setCreatedAt(savedPlan.createdAt)
    setLastSavedAt(new Date(savedPlan.updatedAt))
    setHasSavedPlan(true)
  }, [])

  React.useEffect(() => {
    let isActive = true
    const now = new Date().toISOString()

    setPersisted([])
    setPersistedPlan(createEmptyPlan())
    setCreatedAt(now)
    setLastSavedAt(null)
    setHasSavedPlan(false)
    setIsHydrated(true)
    setIsPlanLoaded(false)
    setSaveRevision(0)

    void getPlan(planId).then((savedPlan) => {
      if (!isActive) {
        return
      }

      applySavedPlan(savedPlan)
      if (savedPlan) {
        markPlanOpened(planId)
      }
      setIsPlanLoaded(true)
    })

    return () => {
      isActive = false
    }
  }, [applySavedPlan, planId])

  React.useEffect(() => {
    if (!isPlanLoaded) {
      return
    }

    const handleAiRewrite = (event: Event) => {
      const detail = (event as CustomEvent<{ planId?: string }>).detail

      if (detail?.planId === planId) {
        void getPlan(planId).then(applySavedPlan)
      }
    }

    window.addEventListener(AI_PLAN_REWRITE_EVENT, handleAiRewrite)

    return () => {
      window.removeEventListener(AI_PLAN_REWRITE_EVENT, handleAiRewrite)
    }
  }, [applySavedPlan, isPlanLoaded, planId])

  React.useEffect(() => {
    if (!isPlanLoaded) {
      return
    }

    if (saveRevision === 0) {
      return
    }

    if (!hasSavedPlan && !isMeaningfulDraft(persistedPlan, persisted)) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (isDeletingPlanRef.current) {
        return
      }

      const updatedAt = new Date().toISOString()
      const plan: SavedPlan = {
        id: planId,
        title: persistedPlan.savedTitle,
        description: persistedPlan.savedDescription,
        completion: persistedPlan.savedCompletion,
        tasks: persisted.map((task) => ({
          id: task.id,
          title: task.savedTitle,
          description: task.savedDescription,
          dueDate: task.dueDate,
          durationMinutes: task.durationMinutes,
          isCompleted: task.isCompleted,
          guidance: task.guidance ?? null,
          parentId: task.parentId ?? null,
        })),
        createdAt,
        updatedAt,
        version: 1,
      }

      void savePlan(plan)
        .then(() => {
          setLastSavedAt(new Date(updatedAt))
          setHasSavedPlan(true)
        })
        .catch(() => {})
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [
    createdAt,
    hasSavedPlan,
    isPlanLoaded,
    persisted,
    persistedPlan,
    planId,
    saveRevision,
  ])

  const markChanged = () => setSaveRevision((revision) => revision + 1)

  const updateTaskTitle = (index: number, newTitle: string) => {
    setPersisted((p) =>
      p.map((item, i) =>
        i === index ? { ...item, savedTitle: newTitle } : item
      )
    )
    markChanged()
  }

  const updateTaskDescription = (index: number, newDescription: string) => {
    setPersisted((p) =>
      p.map((item, i) =>
        i === index ? { ...item, savedDescription: newDescription } : item
      )
    )
    markChanged()
  }

  const updateTaskDate = (index: number, newDueDate: string) => {
    setPersisted((p) =>
      p.map((item, i) =>
        i === index ? { ...item, dueDate: newDueDate } : item
      )
    )
    markChanged()
  }

  const updateTaskDuration = (index: number, newDurationMinutes: number) => {
    setPersisted((p) =>
      p.map((item, i) =>
        i === index ? { ...item, durationMinutes: newDurationMinutes } : item
      )
    )
    markChanged()
  }

  const applyCompletion = (index: number, isCompleted: boolean) => {
    setPersisted((p) =>
      p.map((item, i) => (i === index ? { ...item, isCompleted } : item))
    )
    markChanged()
  }

  const updateTaskCompletion = (index: number, isCompleted: boolean) => {
    if (!isCompleted) {
      applyCompletion(index, false)
      return
    }
    const task = persisted[index]
    if (!task) return
    setReflectionNote("")
    setCompletionGate({ index, stepId: task.id })
  }

  const handleReflectionSubmit = async (note: string) => {
    if (!completionGate) return
    applyCompletion(completionGate.index, true)
    setCompletionGate(null)
    setReflectionNote("")
    if (note.trim()) {
      try {
        await fetch(`/api/plans/${planId}/steps/${completionGate.stepId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completionNote: note.trim() }),
        })
      } catch {
        // non-blocking — completion note is best-effort
      }
    }
  }

  const deleteTask = (index: number) => {
    setPersisted((p) => {
      const target = p[index]
      if (!target) return p
      // Deleting a parent also removes its subtasks
      return p.filter((item, i) => i !== index && item.parentId !== target.id)
    })
    markChanged()
  }

  const addSubtask = (parentIndex: number) => {
    setPersisted((p) => {
      const parent = p[parentIndex]
      if (!parent || parent.parentId) return p

      // Insert after the parent's last consecutive subtask so display order
      // (flat array) keeps children grouped under their parent
      let insertAt = parentIndex + 1
      while (insertAt < p.length && p[insertAt]?.parentId === parent.id) {
        insertAt += 1
      }

      const child = createTask(
        "",
        "",
        parent.dueDate || format(new Date(), "yyyy-MM-dd"),
        15,
        parent.id
      )

      return [...p.slice(0, insertAt), child, ...p.slice(insertAt)]
    })
    markChanged()
  }

  const updatePlanTitle = (newTitle: string) => {
    setPersistedPlan((p) => ({ ...p, savedTitle: newTitle }))
    markChanged()
  }

  const updatePlanDescription = (newDescription: string) => {
    setPersistedPlan((p) => ({ ...p, savedDescription: newDescription }))
    markChanged()
  }

  const updatePlanCompletion = (newCompletion: string) => {
    setPersistedPlan((p) => ({ ...p, savedCompletion: newCompletion }))
    markChanged()
  }

  const reorderTasks = (fromIndex: number, toIndex: number) => {
    setPersisted((p) => {
      const newPersisted = [...p]
      const [removed] = newPersisted.splice(fromIndex, 1)
      newPersisted.splice(
        toIndex,
        0,
        removed ?? createTask("", "", format(new Date(), "yyyy-MM-dd"), 30)
      )
      return newPersisted
    })
    markChanged()
  }

  const handleAddTask = (
    title: string,
    description: string,
    dueDate = format(new Date(), "yyyy-MM-dd"),
    durationMinutes = 30
  ) => {
    setPersisted((p) => [
      ...p,
      createTask(title, description, dueDate, durationMinutes),
    ])
    markChanged()
  }

  const planSummary = React.useMemo(() => {
    const totalMinutes = persisted.reduce(
      (sum, task) => sum + task.durationMinutes,
      0
    )
    const dueDates = persisted
      .map((task) => task.dueDate)
      .filter((dueDate): dueDate is string => Boolean(dueDate))
      .sort()

    return {
      startDate: dueDates[0] ?? "",
      dueDate: dueDates.at(-1) ?? "",
      steps: {
        count: persisted.length,
        hours: Math.round((totalMinutes / 60) * 100) / 100,
      },
    }
  }, [persisted])

  const handleDeletePlan = React.useCallback(async () => {
    const planTitle = persistedPlan.savedTitle.trim() || "Untitled Plan"
    const action = hasSavedPlan ? "Delete" : "Discard"
    const shouldDelete = window.confirm(`${action} "${planTitle}"?`)

    if (!shouldDelete) {
      return
    }

    isDeletingPlanRef.current = true

    try {
      if (hasSavedPlan) {
        await deletePlan(planId)
      }

      router.push("/app/plans")
    } catch {
      isDeletingPlanRef.current = false
      window.alert("Could not delete this plan. Try again in a moment.")
    }
  }, [hasSavedPlan, persistedPlan.savedTitle, planId, router])

  if (!isPlanLoaded) {
    return <PlanEditorLoadingState state={state} />
  }

  return (
    <>
      <HeaderLeft>
        <Breadcrumb className="text-sm font-medium">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/app/plans">Plans</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">
                {persistedPlan.savedTitle.trim().length === 0
                  ? "New Plan"
                  : persistedPlan.savedTitle || "Untitled Plan"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </HeaderLeft>

      <HeaderRight>
        {isHydrated && (
          <Tooltip>
            <TooltipTrigger>
              <CloudCheckIcon className="size-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <span>
                {lastSavedAt
                  ? `Saved at ${format(lastSavedAt, "HH:mm:ss")}`
                  : "Not saved yet"}
              </span>
            </TooltipContent>
          </Tooltip>
        )}

        <NavActions
          copyUrl={`/app/plan?id=${encodeURIComponent(planId)}`}
          onDelete={handleDeletePlan}
        />
        <PublishPlanAsTemplateDialog planId={planId} />
      </HeaderRight>

      <ScrollArea
        data-plan-id={planId}
        className={
          "relative flex max-h-[calc(100vh-1rem)] min-h-0 flex-1 flex-col px-8"
        }
      >
        <PlanDetails
          title={persistedPlan.savedTitle}
          description={persistedPlan.savedDescription}
          startDate={planSummary.startDate}
          date={planSummary.dueDate}
          steps={planSummary.steps}
          completion={persistedPlan.savedCompletion}
          onTitleChange={updatePlanTitle}
          onDescriptionChange={updatePlanDescription}
          onCompletionChange={updatePlanCompletion}
        />

        <TaskList
          persisted={persisted}
          onReorder={reorderTasks}
          onTitleChange={updateTaskTitle}
          onDescriptionChange={updateTaskDescription}
          onDateChange={updateTaskDate}
          onDurationChange={updateTaskDuration}
          onCompletedChange={updateTaskCompletion}
          onDeleteTask={deleteTask}
          onAddTask={handleAddTask}
          onAddSubtask={addSubtask}
          emptyState={() => (
            <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-4 pt-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ListTodoIcon aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-medium">No steps yet</h2>
                <p className="text-sm text-muted-foreground">
                  Start with one clear step, then add dates and durations as the
                  plan takes shape.
                </p>
              </div>
            </section>
          )}
        />

        {(isPlanLoaded && !persistedPlan.savedTitle) ||
        !persistedPlan.savedDescription ? (
          <section className="absolute bottom-8 left-1/2 mx-auto flex w-full max-w-3xl flex-1 -translate-x-1/2 flex-col items-start justify-center gap-4">
            <div className="flex flex-col gap-1">
              <p className="mb-1 text-xs text-muted-foreground">
                Get started with
              </p>
              <Button variant="secondary" onClick={toggleSidebarRight}>
                <AiPlannerIcon />
                <span className="text-xs">AI Planner</span>
              </Button>
            </div>
          </section>
        ) : null}

        <Button
          onClick={toggleSidebarRight}
          variant={"default"}
          size={"icon-lg"}
          className={cn(
            "absolute right-6 bottom-6 transition-opacity",
            openRight && "pointer-events-none opacity-0"
          )}
        >
          <Asterisk01 />
        </Button>
      </ScrollArea>

      <Dialog
        open={!!completionGate}
        onOpenChange={(open) => {
          if (!open) setCompletionGate(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bước này bạn đã làm được gì?</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Viết ngắn gọn điều bạn học được hoặc kết quả cụ thể — không cần dài, 1-2 câu là đủ."
            value={reflectionNote}
            onChange={(e) => setReflectionNote(e.target.value)}
            className="min-h-[80px] resize-none"
            autoFocus
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => void handleReflectionSubmit("")}
            >
              Bỏ qua
            </Button>
            <Button onClick={() => void handleReflectionSubmit(reflectionNote)}>
              Xác nhận hoàn thành
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
