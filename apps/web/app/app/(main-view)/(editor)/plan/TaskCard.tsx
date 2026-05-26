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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import {
  ArchiveIcon,
  CalendarIcon,
  CheckIcon,
  TimerIcon,
  MoreVerticalIcon,
  Trash2Icon,
} from "lucide-react"

export interface TaskCardProps {
  taskTitle?: string
  taskDescription?: string
  dueDate?: string | Date
  durationMinutes?: number
  isCompleted?: boolean
  savedTitle?: string
  savedDescription?: string
  onTitleChange?: (title: string) => void
  onDescriptionChange?: (description: string) => void
  onDateChange?: (date: string) => void
  onDurationChange?: (durationMinutes: number) => void
  onCompletedChange?: (isCompleted: boolean) => void
  onDelete?: () => void
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

export default function TaskCard({
  taskTitle,
  taskDescription,
  dueDate,
  durationMinutes = 30,
  isCompleted,
  savedTitle,
  savedDescription,
  onTitleChange,
  onDescriptionChange,
  onDateChange,
  onDurationChange,
  onCompletedChange,
  onDelete,
}: TaskCardProps) {
  const parseDate = (d?: string | Date) => {
    if (!d) return undefined
    const dt = typeof d === "string" ? new Date(d) : d
    return isNaN(dt.getTime()) ? undefined : dt
  }

  const date = parseDate(dueDate)
  const duration = durationMinutes
  const [customDuration, setCustomDuration] = React.useState("")

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

  React.useEffect(() => {
    // when parent persisted values change, reset local inputs
    if (savedTitle !== undefined) setTitle(savedTitle)
    if (savedDescription !== undefined) setDescription(savedDescription)
  }, [savedTitle, savedDescription])

  // const resizeDesc = () => {
  //   const el = descRef.current
  //   if (!el) return
  //   el.style.height = "auto"
  //   el.style.height = `${el.scrollHeight}px`
  // }

  // const resizeTitle = () => {
  //   const el = titleRef.current
  //   if (!el) return
  //   el.style.height = "auto"
  //   el.style.height = `${el.scrollHeight}px`
  // }

  // React.useEffect(() => {
  //   resizeTitle()
  //   resizeDesc()
  // }, [])

  const handleCustomDurationSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const minutes = Number.parseInt(customDuration, 10)
    if (!Number.isFinite(minutes) || minutes < 1) {
      return
    }

    onDurationChange?.(minutes)
    setCustomDuration("")
  }

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      onDateChange?.(format(newDate, "yyyy-MM-dd"))
    }
  }

  const handleDurationChange = (minutes: number) => {
    onDurationChange?.(minutes)
  }

  const hasCustomDuration = !durationOptions.includes(duration)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-row items-start gap-3 border-b p-3 transition-colors hover:bg-accent/30">
      <label className="flex items-center gap-2 text-base font-normal text-gray-900">
        <Checkbox.Root
          checked={isCompleted ?? false}
          onCheckedChange={onCompletedChange}
          className="flex size-6 items-center justify-center rounded-full transition duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97] data-checked:bg-primary data-unchecked:border data-unchecked:border-ring"
        >
          <Checkbox.Indicator className="flex text-primary-foreground transition duration-150 ease-out data-unchecked:scale-90 data-unchecked:opacity-0">
            <CheckIcon className="size-4" />
          </Checkbox.Indicator>
        </Checkbox.Root>
      </label>

      <div className="flex flex-1 flex-col items-start">
        <div className="w-full flex-col items-start">
          <textarea
            ref={titleRef}
            placeholder="Task title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (onTitleChange) onTitleChange(e.target.value)
            }}
            className="field-sizing-content min-w-100 resize-none text-base leading-6 font-medium focus-visible:outline-none active:outline-none"
          />
          <textarea
            ref={descRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              if (onDescriptionChange) onDescriptionChange(e.target.value)
            }}
            placeholder="Task description"
            className="field-sizing-content min-w-100 resize-none overflow-hidden bg-transparent text-sm leading-6 text-muted-foreground focus-visible:outline-none active:outline-none"
          />
        </div>

        {/* Metadata badges */}
        <div className="-ml-1.5 flex w-full items-center gap-2">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="ghost" size={"xs"} className={"h-7.5"}>
                  <CalendarIcon className="h-4 w-4" data-icon="inline-start" />
                  <span>{date ? format(date, "d MMM") : "Pick date"}</span>
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                captionLayout="dropdown"
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="xs" className={"h-7.5"}>
                  <TimerIcon data-icon="inline-start" />
                  <span>{formatDuration(duration)}</span>
                </Button>
              }
            />
            <DropdownMenuContent className="w-44" align="start">
              <DropdownMenuGroup>
                {hasCustomDuration && (
                  <DropdownMenuItem
                    onClick={() => handleDurationChange(duration)}
                    className="justify-between"
                  >
                    <span>{formatDuration(duration)}</span>
                    <CheckIcon />
                  </DropdownMenuItem>
                )}
                {durationOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => handleDurationChange(option)}
                    className="justify-between"
                  >
                    <span>{formatDuration(option)}</span>
                    <CheckIcon
                      className={
                        duration === option ? "opacity-100" : "opacity-0"
                      }
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <form
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleCustomDurationSubmit}
                className="flex items-center gap-1 p-1"
              >
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={customDuration}
                  onChange={(event) => setCustomDuration(event.target.value)}
                  onKeyDown={(event) => event.stopPropagation()}
                  placeholder="Minutes"
                  className="h-8 px-2 text-sm"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="xs"
                  disabled={!customDuration.trim()}
                >
                  Set
                </Button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
