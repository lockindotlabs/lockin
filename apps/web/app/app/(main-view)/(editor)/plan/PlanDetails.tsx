"use client"

import * as React from "react"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"
import { Clock } from "@untitledui/icons"

export interface PlanDetailsProps {
  title?: string
  description?: string
  startDate?: string
  date?: string
  steps?: { count: number; hours?: number }
  completion?: string
  onTitleChange?: (title: string) => void
  onDescriptionChange?: (description: string) => void
  onCompletionChange?: (completion: string) => void
}

function formatHours(hours?: number) {
  if (!hours) {
    return "0 minutes"
  }

  const totalMinutes = Math.round(hours * 60)
  const wholeHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (wholeHours === 0) {
    return `${minutes} minutes`
  }

  if (minutes === 0) {
    return `${wholeHours} ${wholeHours === 1 ? "hour" : "hours"}`
  }

  return `${wholeHours} hr ${minutes} min`
}

function parseDate(date?: string) {
  if (!date) {
    return undefined
  }

  const parsedDate = new Date(date)
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate
}

export default function PlanDetails({
  title = "",
  description = "",
  startDate = "",
  date = "",
  steps = { count: 0, hours: 0 },
  completion = "",
  onTitleChange,
  onDescriptionChange,
  onCompletionChange,
}: PlanDetailsProps) {
  const [editableTitle, setEditableTitle] = React.useState(title)
  const [editableDescription, setEditableDescription] =
    React.useState(description)
  const [editableCompletion, setEditableCompletion] = React.useState(completion)

  React.useEffect(() => {
    if (title !== undefined) setEditableTitle(title)
  }, [title])

  React.useEffect(() => {
    if (description !== undefined) setEditableDescription(description)
  }, [description])

  React.useEffect(() => {
    if (completion !== undefined) setEditableCompletion(completion)
  }, [completion])

  const handleTitleChange = (newTitle: string) => {
    setEditableTitle(newTitle)
    if (onTitleChange) onTitleChange(newTitle)
  }

  const handleDescriptionChange = (newDesc: string) => {
    setEditableDescription(newDesc)
    if (onDescriptionChange) onDescriptionChange(newDesc)
  }

  const handleCompletionChange = (newCompletion: string) => {
    setEditableCompletion(newCompletion)
    onCompletionChange?.(newCompletion)
  }

  const planDetailsSummary = React.useMemo(() => {
    const selectedStartDate = parseDate(startDate)
    const selectedDate = parseDate(date)
    const hasTitle = editableTitle.trim().length > 0
    const hasDescription = editableDescription.trim().length > 0
    const hasCompletion = editableCompletion.trim().length > 0
    const hasSteps = steps.count > 0

    return {
      selectedStartDate,
      selectedDate,
      isEmpty:
        !hasTitle &&
        !hasDescription &&
        !selectedStartDate &&
        !selectedDate &&
        !hasCompletion &&
        !hasSteps,
    }
  }, [
    date,
    editableCompletion,
    editableDescription,
    editableTitle,
    startDate,
    steps.count,
  ])

  return (
    <section className="mx-auto w-full max-w-3xl pt-20 pb-4">
      <div className="flex-1">
        <textarea
          value={editableTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={
            planDetailsSummary.isEmpty ? "Name this plan" : "Plan name"
          }
          className="w-full resize-none text-xl font-medium selection:bg-amber-200 focus-visible:outline-none active:outline-none"
          rows={1}
        />
        <textarea
          value={editableDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder={
            planDetailsSummary.isEmpty
              ? "Describe what you want to accomplish"
              : "Plan description"
          }
          className="leading-1.4 w-full resize-none text-sm selection:bg-amber-200 focus-visible:outline-none active:outline-none"
          rows={2}
        />
      </div>

      <div className="mt-2 flex flex-col">
        <div className="flex items-center gap-4 py-2">
          <div className="flex w-40 items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="size-4" />
            Timeline
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded-md px-2 text-sm">
              {planDetailsSummary.selectedStartDate
                ? format(planDetailsSummary.selectedStartDate, "d MMM")
                : "Now"}
            </span>
            <div className="text-gray-400">
              <ArrowRight size={16} />
            </div>
            <span className="rounded-md px-2 text-sm">
              {planDetailsSummary.selectedDate
                ? format(planDetailsSummary.selectedDate, "d MMM")
                : "No due date"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 py-2 text-sm">
          <div className="w-40 text-sm font-medium text-muted-foreground">
            Steps
          </div>
          <div>
            {steps.count} steps ({formatHours(steps.hours)} to complete)
          </div>
        </div>
        <div className="flex items-start gap-4 py-2 text-sm">
          <div className="w-40 text-sm font-medium text-muted-foreground">
            Completion
          </div>
          <textarea
            value={editableCompletion}
            onChange={(event) => handleCompletionChange(event.target.value)}
            placeholder="Not set"
            aria-label="Completion"
            className="-mt-0.5 field-sizing-content min-w-64 flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </section>
  )
}
