"use client"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  ArrowRightIcon,
  ArrowUpIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ListChecksIcon,
  MessageSquareTextIcon,
  PlusIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { createDbChat } from "@/lib/chat/db-chat-client"
import { AppPageShell } from "@/components/app-page-shell"
import { savePendingAskPrompt } from "@/lib/chat/pending-ask-prompt"
import { cn } from "@/lib/utils"
import type { PlanSummary } from "@/lib/plans/plan-repository"
import { useRecentlyOpenedPlans } from "@/lib/plans/recently-opened-plans"
import { usePlanSummaries } from "@/lib/plans/use-plan-summaries"
import { buildAskHref } from "@/lib/routing/ask-url"
import { buildPlanHref } from "@/lib/routing/plan-url"

function getStartOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function getEndOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
}

function getPlanProgress(
  plan: PlanSummary,
  t: ReturnType<typeof useTranslation>["t"]
) {
  const steps = plan.steps ?? []

  if (steps.length === 0) {
    return t("app.plans.noTasks", { defaultValue: "Chưa có việc" })
  }

  const completedSteps = steps.filter((step) => step.isCompleted).length
  return t("app.plans.taskProgress", {
    completed: completedSteps,
    total: steps.length,
    defaultValue: `${completedSteps}/${steps.length} việc`,
  })
}

export default function Page() {
  const { t } = useTranslation()
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false)
  const { plans, isLoaded } = usePlanSummaries()
  const recentPlans = useRecentlyOpenedPlans(plans).slice(0, 3)

  const todayStart = getStartOfToday()
  const todayEnd = getEndOfToday()
  const totalSteps = plans.reduce(
    (count, plan) => count + (plan.steps?.length ?? 0),
    0
  )
  const completedSteps = plans.reduce(
    (count, plan) =>
      count + (plan.steps?.filter((step) => step.isCompleted).length ?? 0),
    0
  )
  const dueTodayCount = plans.reduce((count, plan) => {
    const dueTodaySteps =
      plan.steps?.filter((step) => {
        if (step.isCompleted || !step.dueDate) {
          return false
        }

        const dueDate = new Date(step.dueDate)
        return dueDate >= todayStart && dueDate <= todayEnd
      }).length ?? 0

    return count + dueTodaySteps
  }, 0)
  const openSteps = Math.max(totalSteps - completedSteps, 0)

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

  const handleQuickPrompt = (nextPrompt: string) => {
    setPrompt(nextPrompt)
  }

  const quickActions = [
    {
      label: t("app.home.quickActions.createPlan", {
        defaultValue: "Tạo kế hoạch",
      }),
      prompt: t("app.home.quickPrompts.createPlan", {
        defaultValue: "Tạo một kế hoạch Sprint tập trung cho ",
      }),
      icon: PlusIcon,
    },
    {
      label: t("app.home.quickActions.breakDown", {
        defaultValue: "Chia nhỏ việc",
      }),
      prompt: t("app.home.quickPrompts.breakDown", {
        defaultValue: "Chia việc này thành các bước rõ ràng: ",
      }),
      icon: ListChecksIcon,
    },
    {
      label: t("app.home.quickActions.reviewProgress", {
        defaultValue: "Xem tiến độ",
      }),
      prompt: t("app.home.quickPrompts.reviewProgress", {
        defaultValue: "Xem tiến độ hiện tại và gợi ý việc nên làm tiếp.",
      }),
      icon: CheckCircle2Icon,
    },
    {
      label: t("app.home.quickActions.studySprint", {
        defaultValue: "Sprint học tập",
      }),
      prompt: t("app.home.quickPrompts.studySprint", {
        defaultValue: "Lập một Sprint học tập 90 phút cho ",
      }),
      icon: TargetIcon,
    },
  ]

  return (
    <AppPageShell>
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t("app.nav.home", { defaultValue: "Trang chủ" })}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("app.home.title", {
              defaultValue: "Hôm nay bạn muốn hoàn thành gì?",
            })}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("app.home.subtitle", {
              defaultValue:
                "Bắt đầu bằng một mục tiêu, tiếp tục kế hoạch cũ, hoặc biến việc rời rạc thành một Sprint tập trung.",
            })}
          </p>
        </div>
        <Link
          href={buildPlanHref()}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "justify-self-start"
          )}
        >
          <PlusIcon data-icon="inline-start" />
          {t("app.actions.newPlan", { defaultValue: "Kế hoạch mới" })}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-5">
          <form
            className="relative flex w-full flex-col"
            onSubmit={handleSubmitPrompt}
          >
            <div className="flex w-full flex-col gap-3 rounded-2xl border bg-background p-3 shadow-sm transition-shadow focus-within:border-ring/75 focus-within:ring-2 focus-within:ring-ring/20">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={t("app.home.inputPlaceholder", {
                  defaultValue: "Mô tả kết quả bạn muốn đạt được...",
                })}
                className="max-h-36 min-h-20 w-full resize-none bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted-foreground/80"
                rows={3}
                aria-label="Message input"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <SparklesIcon className="size-3.5" aria-hidden="true" />
                  {t("app.home.inputHint", {
                    defaultValue:
                      "AI sẽ biến nội dung này thành kế hoạch có thể làm ngay.",
                  })}
                </div>
                <Button
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  aria-label="Send message"
                  disabled={isSubmittingPrompt || prompt.trim().length === 0}
                >
                  <ArrowUpIcon />
                </Button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon

              return (
                <Button
                  key={action.label}
                  type="button"
                  variant="outline"
                  className="h-auto justify-start gap-2 rounded-lg px-3 py-2.5 text-left text-xs"
                  onClick={() => handleQuickPrompt(action.prompt)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{action.label}</span>
                </Button>
              )
            })}
          </div>

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/20 p-4">
              <ClipboardListIcon
                className="mb-3 size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-2xl font-semibold">
                {isLoaded ? plans.length : "-"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("app.home.stats.activePlans", {
                  defaultValue: "Kế hoạch đang mở",
                })}
              </p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <CalendarClockIcon
                className="mb-3 size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-2xl font-semibold">
                {isLoaded ? dueTodayCount : "-"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("app.home.stats.dueToday", {
                  defaultValue: "Hạn hôm nay",
                })}
              </p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <TargetIcon
                className="mb-3 size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-2xl font-semibold">
                {isLoaded ? openSteps : "-"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("app.home.stats.openTasks", {
                  defaultValue: "Việc còn mở",
                })}
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border bg-background p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">
                  {t("app.home.today.title", { defaultValue: "Hôm nay" })}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("app.home.today.subtitle", {
                    defaultValue: "Bước tiếp theo hữu ích nhất.",
                  })}
                </p>
              </div>
              <TargetIcon
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-sm font-medium">
                {dueTodayCount > 0
                  ? t("app.home.today.dueMessage", {
                      count: dueTodayCount,
                      defaultValue:
                        "{{count}} việc cần được chú ý trong hôm nay",
                    })
                  : t("app.home.today.noDeadline", {
                      defaultValue: "Hôm nay chưa có áp lực deadline",
                    })}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {recentPlans.length > 0
                  ? t("app.home.today.continueHint", {
                      defaultValue:
                        "Tiếp tục kế hoạch gần nhất hoặc nhờ AI chọn bước tiếp theo.",
                    })
                  : t("app.home.today.emptyHint", {
                      defaultValue:
                        "Mô tả một mục tiêu, LockIn sẽ biến nó thành Sprint có thể bắt đầu.",
                    })}
              </p>
            </div>
          </section>

          <section className="rounded-xl border bg-background p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">
                  {t("app.home.continue.title", {
                    defaultValue: "Tiếp tục",
                  })}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("app.sidebar.recentPlans", {
                    defaultValue: "Kế hoạch gần đây",
                  })}
                </p>
              </div>
              <Link
                href="/app/plans"
                aria-label={t("app.home.continue.viewAll", {
                  defaultValue: "Xem tất cả kế hoạch",
                })}
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon-sm",
                })}
              >
                <ArrowRightIcon />
              </Link>
            </div>

            {isLoaded && recentPlans.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                {t("app.sidebar.noSavedPlans", {
                  defaultValue: "Chưa có kế hoạch đã lưu",
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {(isLoaded ? recentPlans : [null, null, null]).map(
                  (plan, index) =>
                    plan ? (
                      <Link
                        key={plan.id}
                        href={buildPlanHref({ planId: plan.id })}
                        className="group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {plan.title.trim() ||
                              t("app.plan.untitled", {
                                defaultValue: "Kế hoạch chưa đặt tên",
                              })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getPlanProgress(plan, t)}
                          </p>
                        </div>
                        <ArrowRightIcon
                          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </Link>
                    ) : (
                      <div
                        key={index}
                        className="h-14 animate-pulse rounded-lg bg-muted"
                      />
                    )
                )}
              </div>
            )}
          </section>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() =>
              handleQuickPrompt(
                t("app.home.quickPrompts.nextStep", {
                  defaultValue:
                    "Xem các kế hoạch của tôi và cho biết bước tiếp theo tốt nhất.",
                })
              )
            }
          >
            <MessageSquareTextIcon className="size-4" aria-hidden="true" />
            {t("app.home.nextStepButton", {
              defaultValue: "Hỏi bước tiếp theo",
            })}
          </Button>
        </aside>
      </div>
    </AppPageShell>
  )
}
