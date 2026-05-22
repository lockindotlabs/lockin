import * as React from "react"
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
import TaskCard from "./TaskCard"

export interface TaskListItem {
  savedTitle: string
  savedDescription: string
}

export interface TaskListProps {
  tasks: Array<any>
  persisted: TaskListItem[]
  onReorder: (fromIndex: number, toIndex: number) => void
  onTitleChange: (index: number, title: string) => void
  onDescriptionChange: (index: number, description: string) => void
  onAddTask: (title: string, description: string) => void
}

export default function TaskList({
  tasks,
  persisted,
  onReorder,
  onTitleChange,
  onDescriptionChange,
  onAddTask,
}: TaskListProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [newTaskDescription, setNewTaskDescription] = React.useState("")
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
    onAddTask(newTaskTitle, newTaskDescription)
    setNewTaskTitle("")
    setNewTaskDescription("")
    // Click trigger to close popover
    popoverTriggerRef.current?.click()
  }

  return (
    <>
      {/* Task Label */}
      <div className="mx-auto w-full max-w-3xl py-2">
        <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
      </div>

      {/* Task List with Drag-and-Drop */}
      <div className="mx-auto w-full max-w-3xl space-y-0">
        {persisted.map((p, i) => {
          const t = tasks[i] ?? { taskTitle: "", taskDescription: "", dueDate: "", isCompleted: false }
          const isDragged = draggedIndex === i

          return (
            <div
              key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
              className={`group flex items-start gap-2 transition-opacity duration-200 ${
                isDragged ? "opacity-20" : "opacity-100"
              }`}
            >
              <div className="mt-3 -ml-8 flex shrink-0 items-start justify-center p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVerticalIcon className="size-4 cursor-grab text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing" />
              </div>
              <TaskCard
                taskTitle={t.taskTitle}
                taskDescription={t.taskDescription}
                dueDate={t.dueDate}
                isCompleted={t.isCompleted}
                savedTitle={p.savedTitle}
                savedDescription={p.savedDescription}
                onTitleChange={(title: string) =>
                  onTitleChange(i, title)
                }
                onDescriptionChange={(description: string) =>
                  onDescriptionChange(i, description)
                }
              />
            </div>
          )
        })}
      </div>

      {/* Add Task Form */}
      <div className="mx-auto my-2 flex w-full max-w-3xl">
        <Popover>
          <PopoverTrigger
            ref={popoverTriggerRef}
            render={<Button variant="ghost" className="w-full" />}
            className={"text-muted-foreground"}
          >
            <PlusIcon />
            <span>Add step</span>
          </PopoverTrigger>
          <PopoverContent className="w-3xl" sideOffset={12}>
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
                  <Button variant="outline" size="sm" disabled>
                    <TimerIcon className="h-4 w-4" />
                    <span>Duration</span>
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <CalendarIcon className="h-4 w-4" />
                    <span>Date</span>
                  </Button>
                  <Button variant="outline" size="icon-sm" disabled>
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewTaskTitle("")
                      setNewTaskDescription("")
                      popoverTriggerRef.current?.click()
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
