"use client"

import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import {
  ArrowRightIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  InboxIcon,
  ListCheckIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { PlanGrid } from "@/components/plan-grid"
import { createDbChat } from "@/lib/chat/db-chat-client"
import { savePendingAskPrompt } from "@/lib/chat/pending-ask-prompt"
import { useRecentlyOpenedPlans } from "@/lib/plans/recently-opened-plans"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { buildAskHref } from "@/lib/routing/ask-url"

export default function Page() {
  const { plans } = usePlanSummaries()
  const recentlyOpenedPlans = useRecentlyOpenedPlans(plans)
  const { state } = useSidebar()
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false)
  const homePlans = recentlyOpenedPlans.slice(0, 3)

  const handleSubmitPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextPrompt = prompt.trim()
    if (!nextPrompt || isSubmittingPrompt) {
      return
    }

    setIsSubmittingPrompt(true)

    try {
      const chat = await createDbChat()
      savePendingAskPrompt(chat.id, nextPrompt)
      router.push(buildAskHref({ chatSessionId: chat.id }))
    } catch (error) {
      setIsSubmittingPrompt(false)
      throw error
    }
  }

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-between px-3">
        <SidebarTrigger
          className={`${state == "expanded" && "pointer-events-none hidden opacity-0"} transition-all`}
        />
        <div />
        <Show when="signed-out">
          <RedirectToSignIn />
        </Show>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-col justify-center px-4 py-10 md:py-20">
        <div className="mb-5 px-1 text-center">
          <h1 className="text-3xl tracking-tight">
            What do you need to get done?
          </h1>
        </div>

        <form
          className="relative flex w-full flex-col"
          onSubmit={handleSubmitPrompt}
        >
          <div className="flex w-full flex-col gap-2 rounded-[24px] border bg-background p-2.5 transition-shadow focus-within:border-ring/75 focus-within:ring-2 focus-within:ring-ring/20">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="What do you need to get done?"
              className="max-h-32 min-h-10 w-full resize-none bg-transparent px-1.75 py-1 text-sm outline-none placeholder:text-muted-foreground/80"
              rows={1}
              aria-label="Message input"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <div className="relative flex items-center justify-end">
              <Button
                type="submit"
                variant="default"
                size="icon"
                className="size-8 rounded-full"
                aria-label="Send message"
                disabled={isSubmittingPrompt || prompt.trim().length === 0}
              >
                <ArrowUpIcon className="size-4" />
              </Button>
            </div>
          </div>
        </form>
      </section>

      {plans.length > 0 ? (
        <section className="mx-auto w-full max-w-3xl px-4 pb-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="truncate text-sm text-muted-foreground">
                Recently opened plans
              </h2>
            </div>
            <Link
              href="/app/plans"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ChevronRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <PlanGrid plans={homePlans} />
        </section>
      ) : (
        <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
          <InboxIcon className="size-10" strokeWidth={1.25} />
          <div>
            <h2 className="font-medium">You don't have any saved plans yet</h2>
            <p className="">Create a plan to see it here.</p>
          </div>
        </section>
      )}
    </main>
  )
}
