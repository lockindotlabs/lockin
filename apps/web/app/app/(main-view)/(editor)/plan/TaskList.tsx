import * as React from "react"
import { format } from "date-fns"
import {
  PlusIcon,
  TimerIcon,
  CalendarIcon,
  MoreHorizontalIcon,
  GripVerticalIcon,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Calendar } from "@workspace/ui/components/calendar"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import TaskCard from "./TaskCard"
import type { EditorTask } from "./PlanEditor"

export interface TaskListProps {
  persisted: EditorTask[]
  onReorder: (fromIndex: number, toIndex: number) => void
  onTitleChange: (index: number, title: string) => void
  onDescriptionChange: (index: number, description: string) => void
  onDateChange: (index: number, dueDate: string) => void
  onDurationChange: (index: number, durationMinutes: number) => void
  onCompletedChange: (index: number, isCompleted: boolean) => void
  onDeleteTask: (index: number) => void
  onAddTask: (
    title: string,
    description: string,
    dueDate: string,
    durationMinutes: number
  ) => void
  onAddSubtask?: (index: number) => void
  emptyState?: (openAddTaskForm: () => void) => React.ReactNode
}

const durationOptions = [15, 30, 45, 60, 90, 120]

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} minutes`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`
  }

  return `${hours} hr ${remainingMinutes} min`
}

export default function TaskList({
  persisted,
  onReorder,
  onTitleChange,
  onDescriptionChange,
  onDateChange,
  onDurationChange,
  onCompletedChange,
  onDeleteTask,
  onAddTask,
  onAddSubtask,
  emptyState,
}: TaskListProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [newTaskDescription, setNewTaskDescription] = React.useState("")
  const [newTaskDate, setNewTaskDate] = React.useState<Date | undefined>(
    new Date()
  )
  const [newTaskDuration, setNewTaskDuration] = React.useState(30)
  const [customDuration, setCustomDuration] = React.useState("")
  const [isCustomDurationOpen, setIsCustomDurationOpen] = React.useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false)
  const newTaskTitleRef = React.useRef<HTMLTextAreaElement | null>(null)
  const newTaskDescriptionRef = React.useRef<HTMLTextAreaElement | null>(null)
  const popoverTriggerRef = React.useRef<HTMLButtonElement | null>(null)

  const resizeNewTaskTitle = () => {
    const el = newTaskTitleRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  const resizeNewTaskDescription = () => {
    const el = newTaskDescriptionRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  React.useEffect(() => {
    resizeNewTaskTitle()
    resizeNewTaskDescription()
  }, [newTaskTitle, newTaskDescription])

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return
    onReorder(draggedIndex, dropIndex)
    setDraggedIndex(null)
    setHoverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setHoverIndex(null)
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    onAddTask(
      newTaskTitle,
      newTaskDescription,
      format(newTaskDate ?? new Date(), "yyyy-MM-dd"),
      newTaskDuration
    )
    setNewTaskTitle("")
    setNewTaskDescription("")
    setNewTaskDate(new Date())
    setNewTaskDuration(30)
    setCustomDuration("")
    setIsCustomDurationOpen(false)
    setIsAddTaskOpen(false)
  }

  const handleCustomDurationSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const minutes = Number.parseInt(customDuration, 10)
    if (!Number.isFinite(minutes) || minutes < 1) {
      return
    }

    setNewTaskDuration(minutes)
    setCustomDuration("")
    setIsCustomDurationOpen(false)
  }

  const handleDurationSelectChange = (value: string | null) => {
    if (!value) {
      return
    }

    if (value === "custom") {
      setIsCustomDurationOpen(true)
      return
    }

    setIsCustomDurationOpen(false)
    setNewTaskDuration(Number(value))
  }

  const hasCustomDuration = !durationOptions.includes(newTaskDuration)
  const openAddTaskForm = () => setIsAddTaskOpen(true)
  const hasTasks = persisted.length > 0

  return (
    <>
      {/* Task Label */}
      {hasTasks && (
        <div className="mx-auto w-full max-w-3xl flex-1 py-2">
          <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
        </div>
      )}

      {/* Task List with Drag-and-Drop */}
      {hasTasks ? (
        <div className="mx-auto w-full max-w-3xl space-y-0">
          {persisted.map((p, i) => {
            const isDragged = draggedIndex === i

            return (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                className={`group flex items-start gap-2 transition-opacity duration-200 last:*:border-0 ${
                  isDragged ? "opacity-20" : "opacity-100"
                } ${p.parentId ? "ml-9" : ""}`}
              >
                <div className="mt-3 -ml-8 flex shrink-0 items-start justify-center p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVerticalIcon className="size-4 cursor-grab text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing" />
                </div>
                <TaskCard
                  dueDate={p.dueDate}
                  durationMinutes={p.durationMinutes}
                  isCompleted={p.isCompleted}
                  savedTitle={p.savedTitle}
                  savedDescription={p.savedDescription}
                  guidance={p.guidance}
                  onTitleChange={(title: string) => onTitleChange(i, title)}
                  onDescriptionChange={(description: string) =>
                    onDescriptionChange(i, description)
                  }
                  onDateChange={(dueDate: string) => onDateChange(i, dueDate)}
                  onDurationChange={(durationMinutes: number) =>
                    onDurationChange(i, durationMinutes)
                  }
                  onCompletedChange={(isCompleted: boolean) =>
                    onCompletedChange(i, isCompleted)
                  }
                  onDelete={() => onDeleteTask(i)}
                  isSubtask={Boolean(p.parentId)}
                  onAddSubtask={
                    onAddSubtask && !p.parentId
                      ? () => onAddSubtask(i)
                      : undefined
                  }
                />
              </div>
            )
          })}
        </div>
      ) : (
        emptyState?.(openAddTaskForm)
      )}

      {/* Add Task Form */}
      <div className="mx-auto my-4 flex w-full max-w-3xl pb-24">
        <Popover open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          <PopoverTrigger
            ref={popoverTriggerRef}
            render={
              !hasTasks ? (
                <Button variant="default" />
              ) : (
                <Button variant="ghost" />
              )
            }
          >
            <PlusIcon />
            <span>Add new step</span>
          </PopoverTrigger>
          <PopoverContent className="w-2xl" align="start" sideOffset={12}>
            <div className="flex flex-col gap-2">
              <div>
                <textarea
                  ref={newTaskTitleRef}
                  placeholder="Task name"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onInput={resizeNewTaskTitle}
                  rows={1}
                  className="w-full resize-none border-0 bg-transparent p-0 text-base font-medium placeholder:text-foreground/30 focus-visible:outline-none"
                />
              </div>

              <div>
                <textarea
                  ref={newTaskDescriptionRef}
                  placeholder="Description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  onInput={resizeNewTaskDescription}
                  rows={1}
                  className="h-10 w-full resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <Select
                    value={String(newTaskDuration)}
                    onValueChange={handleDurationSelectChange}
                  >
                    <SelectTrigger
                      className="h-8"
                      aria-label="New task duration"
                    >
                      <TimerIcon data-icon="inline-start" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {hasCustomDuration && (
                          <SelectItem value={String(newTaskDuration)}>
                            {formatDuration(newTaskDuration)}
                          </SelectItem>
                        )}
                        {durationOptions.map((option) => (
                          <SelectItem key={option} value={String(option)}>
                            {formatDuration(option)}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom...</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {isCustomDurationOpen && (
                    <form
                      onSubmit={handleCustomDurationSubmit}
                      className="flex items-center gap-1"
                    >
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={customDuration}
                        onChange={(event) =>
                          setCustomDuration(event.target.value)
                        }
                        onKeyDown={(event) => event.stopPropagation()}
                        placeholder="Minutes"
                        className="h-8 px-2 text-sm"
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={!customDuration.trim()}
                      >
                        Set
                      </Button>
                    </form>
                  )}
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button variant="outline" size="sm">
                          <CalendarIcon />
                          <span>
                            {newTaskDate
                              ? format(newTaskDate, "d MMM")
                              : "Date"}
                          </span>
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newTaskDate}
                        onSelect={setNewTaskDate}
                        captionLayout="dropdown"
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewTaskTitle("")
                      setNewTaskDescription("")
                      setNewTaskDate(new Date())
                      setNewTaskDuration(30)
                      setCustomDuration("")
                      setIsCustomDurationOpen(false)
                      setIsAddTaskOpen(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                  >
                    Add task
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}
