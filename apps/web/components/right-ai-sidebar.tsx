"use client"

import {
  ArrowUpIcon,
  BrainIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisIcon,
  MoreHorizontalIcon,
  PanelRightCloseIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group"
import { cn } from "@workspace/ui/lib/utils"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"

export function InputGroupBlockEnd() {
  return (
    <Field>
      <InputGroup>
        <InputGroupTextarea
          id="block-end-textarea"
          placeholder="Write a comment..."
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            variant="default"
            size="icon-sm"
            className="ml-auto"
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <div className="flex w-full justify-between">
        <Button variant="ghost" size="sm" className="w-fit!">
          <BrainIcon />
          Model
          <ChevronRightIcon data-icon="inline-end" />
        </Button>

        <Button variant="ghost" size="icon-sm">
          <MoreHorizontalIcon />
        </Button>
      </div>
    </Field>
  )
}

interface RightAiSidebarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function RightAiSidebar({ isOpen, onOpenChange }: RightAiSidebarProps) {
  return (
    <div
      className={cn(
        "h-screen min-w-0 shrink-0 overflow-hidden",
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      <div
        className={cn(
          "relative h-full w-full bg-background transition-opacity duration-200 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      >
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          🚧 In construction
        </p>

        <div className="flex h-full flex-col blur-lg">
          <div className="flex h-14 items-center justify-between px-3">
            <Button variant="ghost">
              Plan an animation plan
              <ChevronDownIcon data-icon="inline-end" />
            </Button>

            <ButtonGroup>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Close AI sidebar"
                onClick={() => onOpenChange(false)}
              >
                <PanelRightCloseIcon />
              </Button>
              <Button variant="secondary" size="icon" aria-label="More options">
                <EllipsisIcon />
              </Button>
            </ButtonGroup>
          </div>

          <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <div className="max-w-62 rounded-[20px] bg-muted px-3 py-2 text-sm leading-5 text-foreground/90">
                  Based on our kickoff meeting notes from yesterday, draft a
                  follow-up email to the team and create a list of action items
                  in a table
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Done in 20s</span>
                <ChevronRightIcon className="size-4" />
              </div>

              <div className="space-y-0 text-sm leading-6 text-foreground/90">
                <p>Follow-up email draft</p>
                <p>
                  Subject: Project AS Mobbin - Kickoff Follow-Up &amp; Next
                  Steps
                </p>
                <p>Hi team,</p>
                <p>
                  Thanks again for the productive kickoff session for Project AS
                  Mobbin. As a quick recap, we aligned on the three core pillars
                  for the initiative: cross-platform migration, real-time
                  analytics integration, and a full visual redesign aligned with
                  the 2026 branding guidelines, with a target of increasing DAU
                  by 20%.
                </p>
              </div>
            </div>

            <InputGroupBlockEnd />
          </div>
        </div>
      </div>
    </div>
  )
}
