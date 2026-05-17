"use client"

import * as React from "react"
import {
  Calendar as CalendarIcon,
  ArrowRight,
  CheckCircle,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export interface PlanDetailsProps {
  title?: string
  description?: string
  date?: string
  steps?: { count: number; hours?: number }
  completion?: string
  onTitleChange?: (title: string) => void
  onDescriptionChange?: (description: string) => void
}

export default function PlanDetails({
  title = "A new plan",
  description = "This is a description of the plan. It can be a bit longer to provide more context about what needs to be done.",
  date = "29/03/26",
  steps = { count: 4, hours: 4 },
  completion = "A new page",
  onTitleChange,
  onDescriptionChange,
}: PlanDetailsProps) {
  const [editableTitle, setEditableTitle] = React.useState(title)
  const [editableDescription, setEditableDescription] =
    React.useState(description)

  React.useEffect(() => {
    if (title !== undefined) setEditableTitle(title)
  }, [title])

  React.useEffect(() => {
    if (description !== undefined) setEditableDescription(description)
  }, [description])

  const handleTitleChange = (newTitle: string) => {
    setEditableTitle(newTitle)
    if (onTitleChange) onTitleChange(newTitle)
  }

  const handleDescriptionChange = (newDesc: string) => {
    setEditableDescription(newDesc)
    if (onDescriptionChange) onDescriptionChange(newDesc)
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-4">
      <div className="flex-1">
        <textarea
          value={editableTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Plan name"
          className="w-full resize-none text-xl font-medium selection:bg-amber-200 focus-visible:outline-none active:outline-none"
          rows={1}
        />
        <textarea
          value={editableDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Plan description"
          className="w-full resize-none text-sm selection:bg-amber-200 focus-visible:outline-none active:outline-none"
          rows={1}
        />
      </div>

      <div className="mt-2 flex flex-col">
        <div className="flex h-10 items-center gap-4">
          <div className="w-40 text-sm font-medium text-muted-foreground">
            Timeline
          </div>
          <div className="flex items-center gap-1">
            <Button size={"sm"} className={"h-7 px-2"} variant={"ghost"}>
              Now
            </Button>
            <div className="text-gray-400">
              <ArrowRight size={16} />
            </div>
            <Button size={"sm"} className={"h-7 px-2"} variant={"ghost"}>
              <CalendarIcon size={16} />
              <span className="whitespace-nowrap">{date}</span>
            </Button>
          </div>
        </div>
        <div className="flex h-10 items-center gap-4 text-sm">
          <div className="w-40 text-sm font-medium text-muted-foreground">
            Steps
          </div>
          <div>
            {steps.count} steps ({steps.hours} hours to complete)
          </div>
        </div>
        <div className="flex h-10 items-center gap-4 text-sm">
          <div className="w-40 text-sm font-medium text-muted-foreground">
            Completion
          </div>
          <div className="flex items-center gap-2">
            <span>{completion}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
