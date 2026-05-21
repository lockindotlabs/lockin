"use client"


import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Textarea } from "@workspace/ui/components/textarea"
import { time } from "node:console"

export function FeedbackPopover({ trigger }: { trigger?: React.ReactElement }) {
  const handleSubmit = () => {
    Promise.resolve(new Promise((resolve) => setTimeout(resolve, 1000)))
      .then(() => {
        alert("Feedback submitted! Thank you for your input.")
      })
      .finally(() => {})
  }

  return (
    <>
      <Popover defaultOpen>
        <PopoverTrigger
          render={
            <Button
              size={"icon-lg"}
              className={
                "rounded-full p-6! shadow-md active:scale-[0.97] [&_svg]:size-5!"
              }
            >
              <MessageSquareDotIcon data-icon="inline-start" />
            </Button>
          }
        />
        <PopoverContent
          align="end"
          side="right"
          sideOffset={16}
          className={"min-w-80"}
        >
          <Textarea
            placeholder="Type your feedback here..."
            rows={6}
            className="max-h-60 resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              We don't response to submissions, but we read all of them
              carefully
            </div>
            <Button variant={"outline"} onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
