"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  Clock3Icon,
  FileTextIcon,
  GraduationCapIcon,
  InboxIcon,
  ListChecksIcon,
  Loader2Icon,
  LockIcon,
  RocketIcon,
  SendHorizonalIcon,
  TimerIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { createDbChat } from "@/lib/chat/db-chat-client"
import { savePendingAskPrompt } from "@/lib/chat/pending-ask-prompt"
import { MyTemplatesPanel } from "@/components/templates/MyTemplatesPanel"
import {
  buildMarketplaceTemplateDetail,
  buildTemplatePrompt,
} from "@/lib/templates/marketplace-detail"

type TemplateStep = {
  id: string
  order: number
  title: string
  estimatedMinutes: number
  guidance?: string | null
}

type ScaffoldQuestion = {
  id: string
  order: number
  prompt: string
  helperText?: string | null
}

type TemplateScaffoldField = {
  id: string
  label: string
  placeholder: string
  helperText?: string
}

type TemplateDetail = {
  overview: string
  whatThisTemplateDoes: string[]
  sprintableWork: string[]
  longRunningWork: string[]
  deliverables: string[]
  saveReadinessChecks: string[]
  scaffoldFields: TemplateScaffoldField[]
}

type MarketTemplate = {
  id: string
  slug: string
  title: string
  category: string
  description: string | null
  authorName?: string | null
  installCount?: number
  outputType: "DOCUMENT" | "SKILL_PRACTICE" | "PROJECT"
  isAcademic: boolean
  supportsGroupMode: boolean
  steps: TemplateStep[]
  scaffoldQuestions: ScaffoldQuestion[]
  detail: TemplateDetail | null
  locked?: boolean
  requiredTier?: "PLUS" | "PRO" | null
  lockReason?: string | null
}

const OUTPUT_TYPE_META: Record<
  MarketTemplate["outputType"],
  { labelKey: string; icon: React.ReactNode }
> = {
  DOCUMENT: {
    labelKey: "app.templates.badges.document",
    icon: <FileTextIcon className="size-3" />,
  },
  SKILL_PRACTICE: {
    labelKey: "app.templates.badges.skillPractice",
    icon: <ListChecksIcon className="size-3" />,
  },
  PROJECT: {
    labelKey: "app.templates.badges.project",
    icon: <RocketIcon className="size-3" />,
  },
}

function totalMinutes(steps: TemplateStep[]) {
  return steps.reduce((sum, step) => sum + step.estimatedMinutes, 0)
}

function formatTotalDuration(
  minutes: number,
  t: ReturnType<typeof useTranslation>["t"]
) {
  if (minutes < 60) {
    return t("app.templates.duration.minutes", {
      count: minutes,
      defaultValue: "{{count}} min",
    })
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0
    ? t("app.templates.duration.hours", {
        count: hours,
        defaultValue: "{{count}}h",
      })
    : t("app.templates.duration.hoursMinutes", {
        hours,
        minutes: rest,
        defaultValue: "{{hours}}h{{minutes}}m",
      })
}

function TemplateCard({
  template,
  isActive,
  onSelect,
}: {
  template: MarketTemplate
  isActive: boolean
  onSelect: (template: MarketTemplate) => void
}) {
  const { t } = useTranslation()
  const outputMeta = OUTPUT_TYPE_META[template.outputType]

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className={`flex w-full flex-col rounded-2xl border p-5 text-left transition-all hover:shadow-md ${
        isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-background"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpenIcon className="size-4.5" />
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {template.isAcademic && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <GraduationCapIcon className="size-3" />
              {t("app.templates.badges.academic")}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1 text-[10px]">
            {outputMeta.icon}
            {t(outputMeta.labelKey)}
          </Badge>
          {template.supportsGroupMode && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <UsersIcon className="size-3" />
              {t("app.templates.badges.group")}
            </Badge>
          )}
          {template.locked && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <LockIcon className="size-3" />
              Plus
            </Badge>
          )}
        </div>
      </div>

      <h3 className="mb-1 leading-snug font-medium">{template.title}</h3>
      {template.description && (
        <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
          {template.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <ListChecksIcon className="size-3.5" />
            {t("app.templates.stats.steps", {
              count: template.steps.length,
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3Icon className="size-3.5" />~
            {formatTotalDuration(totalMinutes(template.steps), t)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {typeof template.installCount === "number" ? (
            <span>
              {t("app.templates.stats.installs", {
                count: template.installCount,
              })}
            </span>
          ) : null}
          <ChevronRightIcon className="size-4 shrink-0" />
        </div>
      </div>
    </button>
  )
}

function DetailList({
  title,
  items,
  icon,
}: {
  title: string
  items: string[]
  icon: React.ReactNode
}) {
  if (items.length === 0) return null

  return (
    <section className="rounded-2xl border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function TemplateDetailPane({ template }: { template: MarketTemplate | null }) {
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [isStarting, setIsStarting] = React.useState(false)

  React.useEffect(() => {
    if (!template) {
      setAnswers({})
      return
    }

    const nextState = Object.fromEntries(
      buildMarketplaceTemplateDetail(template).scaffoldFields.map((field) => [
        field.id,
        "",
      ])
    )
    setAnswers(nextState)
  }, [template])

  if (!template) {
    return (
      <div className="sticky top-6 rounded-2xl border border-dashed bg-background/50 p-10 text-center text-sm text-muted-foreground">
        <BookOpenIcon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
        {t("app.templates.detail.empty")}
      </div>
    )
  }

  const detail = buildMarketplaceTemplateDetail(template)
  const scaffoldFields = detail.scaffoldFields
  const allScaffoldsFilled =
    scaffoldFields.length === 0 ||
    scaffoldFields.every((field) => (answers[field.id]?.trim().length ?? 0) > 0)

  const handleStart = async () => {
    if (!allScaffoldsFilled || isStarting || template.locked) {
      return
    }

    setIsStarting(true)

    try {
      const installResponse = await fetch(
        `/api/templates/${template.id}/install`,
        {
          method: "POST",
        }
      )
      if (!installResponse.ok) {
        const payload = await installResponse.json().catch(() => null)
        toast.error(payload?.message ?? t("app.templates.toast.installFailed"))
        return
      }

      const chat = await createDbChat()
      savePendingAskPrompt(
        chat.id,
        buildTemplatePrompt(template, answers, i18n.language)
      )

      const params = new URLSearchParams()
      params.set("id", chat.id)
      params.set("chatSessionId", chat.id)
      params.set("template", template.id)

      router.push(`/app/ask?${params.toString()}`)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="sticky top-6 space-y-4">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {t("app.templates.detail.heading")}
            </p>
            <h2 className="text-xl font-medium tracking-tight">
              {template.title}
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              {OUTPUT_TYPE_META[template.outputType].icon}
              {t(OUTPUT_TYPE_META[template.outputType].labelKey)}
            </Badge>
            {template.supportsGroupMode && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <UsersIcon className="size-3" />
                {t("app.templates.badges.teamBased")}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {detail?.overview ??
            template.description ??
            t("app.templates.detail.fallbackOverview")}
        </p>
        {template.authorName ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("app.templates.detail.author", { author: template.authorName })}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-muted/20 p-3">
            <p className="text-[11px] text-muted-foreground uppercase">
              {t("app.templates.detail.workflowSize")}
            </p>
            <p className="mt-1 text-sm font-medium">
              {t("app.templates.stats.coreSteps", {
                count: template.steps.length,
              })}
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/20 p-3">
            <p className="text-[11px] text-muted-foreground uppercase">
              {t("app.templates.detail.totalEstimate")}
            </p>
            <p className="mt-1 text-sm font-medium">
              ~{formatTotalDuration(totalMinutes(template.steps), t)}
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/20 p-3">
            <p className="text-[11px] text-muted-foreground uppercase">
              {t("app.templates.detail.scaffoldQuestions")}
            </p>
            <p className="mt-1 text-sm font-medium">
              {t("app.templates.stats.questions", {
                count: template.scaffoldQuestions.length,
              })}
            </p>
          </div>
        </div>
      </section>

      <DetailList
        title={t("app.templates.detail.sections.whatItDoes")}
        items={detail.whatThisTemplateDoes}
        icon={<CheckCircle2Icon className="size-4" />}
      />
      <DetailList
        title={t("app.templates.detail.sections.sprintable")}
        items={detail.sprintableWork}
        icon={<TimerIcon className="size-4" />}
      />
      <DetailList
        title={t("app.templates.detail.sections.longRunning")}
        items={detail.longRunningWork}
        icon={<Clock3Icon className="size-4" />}
      />
      <DetailList
        title={t("app.templates.detail.sections.deliverables")}
        items={detail.deliverables}
        icon={<FileTextIcon className="size-4" />}
      />
      <DetailList
        title={t("app.templates.detail.sections.saveWhen")}
        items={detail.saveReadinessChecks}
        icon={<ListChecksIcon className="size-4" />}
      />

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-medium">
            {t("app.templates.scaffold.title")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("app.templates.scaffold.description")}
          </p>
        </div>

        <div className="space-y-4">
          {scaffoldFields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium">
                {index + 1}. {field.label}
              </label>
              {field.helperText && (
                <p className="text-xs text-muted-foreground">
                  {field.helperText}
                </p>
              )}
              <textarea
                value={answers[field.id] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [field.id]: event.target.value,
                  }))
                }
                placeholder={field.placeholder}
                rows={4}
                className="w-full resize-y rounded-2xl border bg-background px-3 py-2 text-sm ring-0 outline-none placeholder:text-muted-foreground/70 focus:border-ring/70 focus:ring-2 focus:ring-ring/15"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border bg-muted/20 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {t("app.templates.start.title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("app.templates.start.description")}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleStart}
            disabled={!allScaffoldsFilled || isStarting || template.locked}
            className="shrink-0"
          >
            {isStarting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t("app.templates.start.opening")}
              </>
            ) : (
              <>
                <SendHorizonalIcon className="size-4" />
                {t("app.templates.start.button")}
              </>
            )}
          </Button>
        </div>
        {template.locked ? (
          <Link
            href="/app/billing"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <LockIcon className="size-3" />
            {template.lockReason ?? "Upgrade to unlock this template."}
          </Link>
        ) : null}
      </section>
    </div>
  )
}

function MarketplaceFilters({
  searchQuery,
  onSearchQueryChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
}: {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  categories: string[]
}) {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border bg-background p-3 sm:flex-row sm:items-center">
      <Input
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder={t("app.templates.filters.searchPlaceholder")}
        className="sm:max-w-sm"
      />
      <Select
        value={categoryFilter}
        onValueChange={(value) => {
          if (value) onCategoryFilterChange(value)
        }}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder={t("app.templates.filters.allCategories")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t("app.templates.filters.allCategories")}
          </SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function TemplatesPage() {
  const { t } = useTranslation()
  const [templates, setTemplates] = React.useState<MarketTemplate[]>([])
  const [availableCategories, setAvailableCategories] = React.useState<
    string[]
  >([])
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    string | null
  >(null)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [tab, setTab] = React.useState("marketplace")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  React.useEffect(() => {
    let active = true
    const params = new URLSearchParams()
    const search = debouncedSearchQuery.trim()
    if (search) params.set("search", search)
    if (categoryFilter !== "all") params.set("category", categoryFilter)
    const url =
      params.size > 0 ? `/api/templates?${params.toString()}` : "/api/templates"

    setIsLoaded(false)
    fetch(url)
      .then((response) => response.json())
      .then((data: { templates: MarketTemplate[] }) => {
        if (!active) return
        const nextTemplates = data.templates ?? []
        setTemplates(nextTemplates)
        setAvailableCategories((current) =>
          Array.from(
            new Set([
              ...current,
              ...nextTemplates.map((template) => template.category),
            ])
          ).sort()
        )
        setSelectedTemplateId((current) =>
          nextTemplates.some((template) => template.id === current)
            ? current
            : (nextTemplates[0]?.id ?? null)
        )
        setIsLoaded(true)
      })
      .catch(() => {
        if (!active) return
        setTemplates([])
        setSelectedTemplateId(null)
        setIsLoaded(true)
      })

    return () => {
      active = false
    }
  }, [categoryFilter, debouncedSearchQuery])

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? null

  return (
    <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
      <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
        <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 lg:py-0">
        <div className="mb-1 flex items-center gap-3">
          <h1 className="truncate text-2xl font-medium tracking-tight">
            {t("app.templates.title")}
          </h1>
        </div>
        <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
          {t("app.templates.subtitle")}
        </p>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList aria-label={t("app.templates.tabs.aria")}>
              <TabsTrigger value="marketplace">
                {t("app.templates.tabs.marketplace")}
              </TabsTrigger>
              <TabsTrigger value="mine">
                {t("app.templates.tabs.mine")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Link
            href="/app/templates/editor/new"
            className={buttonVariants({ size: "sm" })}
          >
            {t("app.templates.createNew")}
          </Link>
        </div>

        {tab === "mine" ? (
          <MyTemplatesPanel />
        ) : !isLoaded ? (
          <>
            <MarketplaceFilters
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              categories={availableCategories}
            />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-52 animate-pulse rounded-2xl bg-muted"
                  />
                ))}
              </div>
              <div className="h-[720px] animate-pulse rounded-3xl bg-muted" />
            </div>
          </>
        ) : templates.length > 0 ? (
          <>
            <MarketplaceFilters
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              categories={availableCategories}
            />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isActive={template.id === selectedTemplateId}
                    onSelect={(nextTemplate) =>
                      setSelectedTemplateId(nextTemplate.id)
                    }
                  />
                ))}
              </div>

              <TemplateDetailPane template={selectedTemplate} />
            </div>
          </>
        ) : (
          <>
            <MarketplaceFilters
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              categories={availableCategories}
            />
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
              <InboxIcon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">
                {t("app.templates.empty.title")}
              </p>
              <p className="mt-1 text-xs">
                {t("app.templates.empty.description")}
              </p>
            </div>
          </>
        )}
      </section>
    </ScrollArea>
  )
}
