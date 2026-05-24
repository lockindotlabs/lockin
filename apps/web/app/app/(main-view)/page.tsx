"use client"

import { RedirectToSignIn, Show, UserButton } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import { format } from "date-fns"
import {
  ArrowRightIcon,
  ArrowUpIcon,
  BotMessageSquareIcon,
  ChevronDownIcon,
  CpuIcon,
  FolderIcon,
  Globe2Icon,
  HardDriveIcon,
  InboxIcon,
  MoreHorizontalIcon,
  NotebookIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  UsersRoundIcon,
  ZapIcon,
} from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { deletePlan } from "@/lib/plans/plan-repository"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { buildAskHref } from "@/lib/routing/ask-url"

type Suggestion = {
  app: "drive" | "notion" | "gmail" | "teams" | "web" | "more"
  label: ReactNode
  action?: boolean
}

const suggestions: Suggestion[] = [
  {
    app: "drive",
    label: (
      <>
        Improve my doc in <strong>Google Docs</strong>
      </>
    ),
  },
  {
    app: "notion",
    label: (
      <>
        Analyze our <strong>Notion</strong> documentation
      </>
    ),
  },
  {
    app: "gmail",
    label: (
      <>
        Cut through the noise in <strong>Gmail</strong>
      </>
    ),
  },
  {
    app: "teams",
    label: (
      <>
        Recap my <strong>Teams</strong> messages
      </>
    ),
  },
  {
    app: "web",
    label: <>Browse the web and write a newsletter</>,
  },
  {
    app: "more",
    label: <>Connect your apps for better answers</>,
    action: true,
  },
]

function AppMark({ app }: { app: Suggestion["app"] }) {
  if (app === "drive") {
    return <HardDriveIcon className="size-5" strokeWidth={1.5} />
  }

  if (app === "notion") {
    return <NotebookIcon className="size-5" strokeWidth={1.5} />
  }

  if (app === "gmail") {
    return <InboxIcon className="size-5" strokeWidth={1.5} />
  }

  if (app === "teams") {
    return <UsersRoundIcon className="size-5" strokeWidth={1.5} />
  }

  if (app === "web") {
    return <Globe2Icon className="size-5" strokeWidth={1.5} />
  }

  return <MoreHorizontalIcon className="size-5" strokeWidth={1.5} />
}

export default function Page() {
  const { plans } = usePlanSummaries()
  const { state } = useSidebar()

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
      <header className="flex h-14 items-center justify-between px-3">
        <SidebarTrigger
          className={`${state == "expanded" && "pointer-events-none hidden opacity-0"} transition-all`}
        />
        <div />
        <div className="flex items-center gap-2">
          <Show when="signed-in">
            <UserButton />
          </Show>

          <Show when="signed-out">
            <RedirectToSignIn />
          </Show>
        </div>
      </header>

      {plans.length > 0 && (
        <section className="mx-auto mt-10 max-w-2xl">
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
      )}
    </main>
  )
}
