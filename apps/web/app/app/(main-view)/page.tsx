"use client"

import { RedirectToSignIn, Show, UserButton } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
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
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <div className={`flex gap-2`}>
            <Button variant={"outline"} size={"sm"}>
              Docs
            </Button>
            <Button variant={"outline"} size={"sm"}>
              <BotMessageSquareIcon data-icon="inline-start" />
              Ask
            </Button>
            <Button variant={"outline"} size={"icon-sm"}>
              <FolderIcon />
            </Button>
            {/* 
                  <Button
                    variant={"outline"}
                    onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
                    size={"sm"}
                  >
                    <SparklesIcon data-icon="inline-start" />
                    {isAiSidebarOpen ? "Hide AI" : "Open AI"}
                  </Button> */}
          </div>

          <Show when="signed-in">
            <UserButton />
          </Show>

          <Show when="signed-out">
            <RedirectToSignIn />
          </Show>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-5 pb-12 sm:px-8">
        <div className="w-full max-w-[880px]">
          <h1 className="text-lg font-medium">Let's break something down.</h1>
          <div className="mt-4 flex h-14 items-center justify-center gap-4 rounded-full border bg-muted pr-2 pl-5 text-[15px] text-muted-foreground shadow-xs">
            <ZapIcon className="size-5" strokeWidth={1.5} />
            <span className="min-w-0 flex-1 truncate">
              What would you like to do?
            </span>
            <Button
              size="icon-lg"
              variant="default"
              aria-label="Submit prompt"
              className={"rounded-full [&_svg]:size-5!"}
            >
              <ArrowUpIcon />
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <SparklesIcon data-icon="inline-start" />
                Create
              </Button>
              <Button variant="ghost" size="sm">
                <PlusIcon data-icon="inline-start" />
                Sources
              </Button>
            </div>

            <Button variant="ghost" size="sm">
              <CpuIcon data-icon="inline-start" />
              Default
            </Button>
          </div>

          <div className="mt-12 divide-y divide-border/70 border-y border-border/70">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.app}
                className="group flex min-h-17 w-full items-center gap-5 px-5 text-left text-muted-foreground hover:bg-muted/45 hover:text-foreground active:bg-muted/65"
              >
                <AppMark app={suggestion.app} />
                <span className="min-w-0 flex-1 truncate">
                  {suggestion.label}
                </span>
                {suggestion.action && (
                  <ArrowRightIcon
                    strokeWidth={1.5}
                    className="size-5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-foreground"
                  />
                )}
              </button>
            ))}
          </div>

          {plans.length > 0 && (
            <section className="mt-10">
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
                        href={`/app/plan/${plan.id}`}
                        className="flex min-w-0 flex-1 items-center gap-4"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {planTitle}
                        </span>
                        <span className="hidden text-sm text-muted-foreground sm:inline">
                          {plan.taskCount}{" "}
                          {plan.taskCount === 1 ? "step" : "steps"}
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
        </div>
      </section>
    </main>
  )
}
