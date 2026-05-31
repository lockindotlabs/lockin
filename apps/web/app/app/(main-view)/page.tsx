"use client"

import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import { format } from "date-fns"
import { ArrowUpIcon, InboxIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { createDbChat } from "@/lib/chat/db-chat-client"
import { savePendingAskPrompt } from "@/lib/chat/pending-ask-prompt"
import { deletePlan } from "@/lib/plans/plan-repository"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { buildAskHref } from "@/lib/routing/ask-url"

export default function Page() {
  const { plans } = usePlanSummaries()
  const { state } = useSidebar()
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false)

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

  const handleDeletePlan = async (plan: (typeof plans)[number]) => {
    const planTitle = plan.title.trim() || "Untitled Plan"
    const shouldDelete = window.confirm(`Delete "${planTitle}"?`)
    if (!shouldDelete) {
      return
    }

    await deletePlan(plan.id)
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
        <section className="mx-auto w-full max-w-2xl px-4 pb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Saved plans
            </h2>
          </div>
          <div className="divide-y divide-border/70 border-y border-border/70">
            {plans.map((plan) => {
              const planTitle = plan.title.trim() || "Untitled Plan"

              return (
                <div
                  key={plan.id}
                  className="group flex min-h-16 items-center gap-4 px-5 hover:bg-muted/45"
                >
                  <Link
                    href={buildAskHref({ planId: plan.id })}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {planTitle}
                    </span>
                    <span className="hidden text-sm text-muted-foreground sm:inline">
                      {plan.taskCount} {plan.taskCount === 1 ? "step" : "steps"}
                    </span>
                    <span className="hidden text-sm text-muted-foreground md:inline">
                      Updated {format(new Date(plan.updatedAt), "d MMM, HH:mm")}
                    </span>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${planTitle}`}
                    className="opacity-70 hover:opacity-100"
                    onClick={() => handleDeletePlan(plan)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              )
            })}
          </div>
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
