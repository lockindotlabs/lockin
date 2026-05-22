"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import { Checkbox } from "@base-ui/react/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  ArchiveIcon,
  CalendarIcon,
  CheckIcon,
  MoreVerticalIcon,
  Trash2Icon,
} from "lucide-react"

export interface TaskCardProps {
  taskTitle?: string
  taskDescription?: string
  dueDate?: string | Date
  isCompleted?: boolean
  savedTitle?: string
  savedDescription?: string
  onTitleChange?: (title: string) => void
  onDescriptionChange?: (description: string) => void
}

export default function TaskCard({
  taskTitle,
  taskDescription,
  dueDate,
  isCompleted,
  savedTitle,
  savedDescription,
  onTitleChange,
  onDescriptionChange,
}: TaskCardProps) {
  // Debug log to trace props and state changes
  React.useEffect(() => {
    console.log("TaskCard:props", {
      taskTitle,
      taskDescription,
      dueDate,
      isCompleted,
      savedTitle,
      savedDescription,
    })
  }, [
    taskTitle,
    taskDescription,
    dueDate,
    isCompleted,
    savedTitle,
    savedDescription,
  ])

  const parseDate = (d?: string | Date) => {
    if (!d) return undefined
    const dt = typeof d === "string" ? new Date(d) : d
    return isNaN(dt.getTime()) ? undefined : dt
  }

  const [date, setDate] = React.useState<Date | undefined>(
    parseDate(dueDate) ?? new Date(2026, 2, 3)
  )

  const [title, setTitle] = React.useState(
    taskTitle ??
      "This section covers the basics of getting started with this project. You'll learn the fundamental concepts and how to set up your environment for development."
  )
  const titleRef = React.useRef<HTMLTextAreaElement | null>(null)

  const [description, setDescription] = React.useState(
    taskDescription ??
      "AI powered to-do list app to make starting a task easier. Always know what to do first with the help of AI. Made for students and office workers struggling with procrastination."
  )
  const descRef = React.useRef<HTMLTextAreaElement | null>(null)

  // Persisted values moved to parent via props
  const baseTitle = savedTitle ?? taskTitle ?? title
  const baseDescription = savedDescription ?? taskDescription ?? description

  React.useEffect(() => {
    // when parent persisted values change, reset local inputs
    if (savedTitle !== undefined) setTitle(savedTitle)
    if (savedDescription !== undefined) setDescription(savedDescription)
  }, [savedTitle, savedDescription])

  const resizeDesc = () => {
    const el = descRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  const resizeTitle = () => {
    const el = titleRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  React.useEffect(() => {
    resizeTitle()
    resizeDesc()
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-row items-start gap-3 rounded-xl p-3 transition-colors hover:bg-accent/30">
      <label className="flex items-center gap-2 text-base font-normal text-gray-900">
        <Checkbox.Root
          defaultChecked={isCompleted ?? true}
          onCheckedChange={(isCompleted) => {
            return console.log("TaskCard:checkbox:change", { isCompleted })
          }}
          className="flex size-6 items-center justify-center rounded-full transition duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97] data-checked:bg-primary data-unchecked:border data-unchecked:border-ring"
        >
          <Checkbox.Indicator className="flex text-gray-50 transition duration-150 ease-out data-unchecked:scale-90 data-unchecked:opacity-0">
            <CheckIcon className="size-4" />
          </Checkbox.Indicator>
        </Checkbox.Root>
      </label>

      <div className="flex flex-1 flex-col items-start gap-2">
        <div className="w-full flex-col items-start">
          <textarea
            ref={titleRef}
            placeholder="Task title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (onTitleChange) onTitleChange(e.target.value)
              console.log("TaskCard:title:change", e.target.value)
            }}
            onInput={resizeTitle}
            className="w-full resize-none text-sm font-medium focus-visible:outline-none active:outline-none"
            rows={1}
          />
          <textarea
            ref={descRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              if (onDescriptionChange) onDescriptionChange(e.target.value)
              console.log("TaskCard:description:change", e.target.value)
            }}
            onInput={resizeDesc}
            placeholder="Task description"
            className="w-full resize-none overflow-hidden bg-transparent text-sm text-muted-foreground focus-visible:outline-none active:outline-none"
            rows={1}
          />
        </div>

        {/* Metadata badges */}
        <div className="flex w-full items-center justify-between">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size={"sm"}>
                  <CalendarIcon className="h-4 w-4" data-icon="inline-start" />
                  <span className="text-sm font-medium">
                    {date ? format(date, "d MMM") : "Pick date"}
                  </span>
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                captionLayout="dropdown"
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 data-open:bg-accent"
            />
          }
        >
          <MoreVerticalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
