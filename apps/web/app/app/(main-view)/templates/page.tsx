"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  RocketIcon,
  SendHorizonalIcon,
  TimerIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { createDbChat } from "@/lib/chat/db-chat-client"
import { savePendingAskPrompt } from "@/lib/chat/pending-ask-prompt"
import { MyTemplatesPanel } from "@/components/templates/MyTemplatesPanel"

type TemplateStep = {
  id: string
  order: number
  title: string
  estimatedMinutes: number
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
}

const OUTPUT_TYPE_META: Record<
  MarketTemplate["outputType"],
  { label: string; icon: React.ReactNode }
> = {
  DOCUMENT: { label: "Tai lieu", icon: <FileTextIcon className="size-3" /> },
  SKILL_PRACTICE: {
    label: "Luyen tap",
    icon: <ListChecksIcon className="size-3" />,
  },
  PROJECT: { label: "Du an", icon: <RocketIcon className="size-3" /> },
}

function totalMinutes(steps: TemplateStep[]) {
  return steps.reduce((sum, step) => sum + step.estimatedMinutes, 0)
}

function formatTotalDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phut`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} gio` : `${hours}h${rest}p`
}

function buildTemplatePrompt(
  template: MarketTemplate,
  answers: Record<string, string>
) {
  const scaffoldEntries = Object.entries(answers)
    .map(([id, value]) => {
      const field =
        template.detail?.scaffoldFields.find((item) => item.id === id) ?? null
      if (!value.trim() || !field) return null
      return `- ${field.label}: ${value.trim()}`
    })
    .filter(Boolean)
    .join("\n")

  const sprintable = template.detail?.sprintableWork
    .map((item) => `- ${item}`)
    .join("\n")
  const longRunning = template.detail?.longRunningWork
    .map((item) => `- ${item}`)
    .join("\n")

  return [
    `Toi muon lap plan theo template "${template.title}".`,
    template.description ? `Context template: ${template.description}` : null,
    "Hay lap plan theo dung workflow cua template nay.",
    "Phan tach ro cac buoc Thinking - Execution - Review.",
    "Neu co viec khong the xong trong 1 sprint, hay danh dau no la viec can theo doi dai hon 1 sprint.",
    sprintable ? `Nhung viec co the sprint duoc:\n${sprintable}` : null,
    longRunning
      ? `Nhung viec can thoi gian dai hon 1 sprint:\n${longRunning}`
      : null,
    scaffoldEntries
      ? `Day la cau tra loi scaffold cua toi:\n${scaffoldEntries}`
      : null,
    "Chi khi plan da du context, du cac phase, va du guidance thi moi de xuat save plan.",
  ]
    .filter(Boolean)
    .join("\n\n")
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
              Hoc thuat
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1 text-[10px]">
            {outputMeta.icon}
            {outputMeta.label}
          </Badge>
          {template.supportsGroupMode && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <UsersIcon className="size-3" />
              Nhom
            </Badge>
          )}
        </div>
      </div>

      <h3 className="mb-1 font-medium leading-snug">{template.title}</h3>
      {template.description && (
        <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
          {template.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <ListChecksIcon className="size-3.5" />
            {template.steps.length} buoc
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3Icon className="size-3.5" />~
            {formatTotalDuration(totalMinutes(template.steps))}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {typeof template.installCount === "number" ? (
            <span>{template.installCount} cai dat</span>
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

function TemplateDetailPane({
  template,
}: {
  template: MarketTemplate | null
}) {
  const router = useRouter()
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [isStarting, setIsStarting] = React.useState(false)

  React.useEffect(() => {
    if (!template) {
      setAnswers({})
      return
    }

    const nextState = Object.fromEntries(
      (template.detail?.scaffoldFields ?? []).map((field) => [field.id, ""])
    )
    setAnswers(nextState)
  }, [template])

  if (!template) {
    return (
      <div className="sticky top-6 rounded-2xl border border-dashed bg-background/50 p-10 text-center text-sm text-muted-foreground">
        <BookOpenIcon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
        Chon mot template de xem chi tiet workflow, scaffold questions, va cach no se chia viec.
      </div>
    )
  }

  const detail = template.detail
  const scaffoldFields = detail?.scaffoldFields ?? []
  const allScaffoldsFilled =
    scaffoldFields.length === 0 ||
    scaffoldFields.every((field) => (answers[field.id]?.trim().length ?? 0) > 0)

  const handleStart = async () => {
    if (!allScaffoldsFilled || isStarting) {
      return
    }

    setIsStarting(true)

    try {
      void fetch(`/api/templates/${template.id}/install`, { method: "POST" })
      const chat = await createDbChat()
      savePendingAskPrompt(chat.id, buildTemplatePrompt(template, answers))

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
              Template Detail
            </p>
            <h2 className="text-xl font-medium tracking-tight">
              {template.title}
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              {OUTPUT_TYPE_META[template.outputType].icon}
              {OUTPUT_TYPE_META[template.outputType].label}
            </Badge>
            {template.supportsGroupMode && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <UsersIcon className="size-3" />
                Team-based
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {detail?.overview ?? template.description ?? "Khung quy trinh cho template nay."}
        </p>
        {template.authorName ? (
          <p className="mt-2 text-sm text-muted-foreground">Tac gia: {template.authorName}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-muted/20 p-3">
            <p className="text-[11px] text-muted-foreground uppercase">Workflow size</p>
            <p className="mt-1 text-sm font-medium">{template.steps.length} buoc cot loi</p>
          </div>
          <div className="rounded-2xl border bg-muted/20 p-3">
            <p className="text-[11px] text-muted-foreground uppercase">Total estimate</p>
            <p className="mt-1 text-sm font-medium">
              ~{formatTotalDuration(totalMinutes(template.steps))}
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/20 p-3">
            <p className="text-[11px] text-muted-foreground uppercase">Scaffold questions</p>
            <p className="mt-1 text-sm font-medium">
              {template.scaffoldQuestions.length} cau hoi
            </p>
          </div>
        </div>
      </section>

      <DetailList
        title="Template se giup lam gi"
        items={detail?.whatThisTemplateDoes ?? []}
        icon={<CheckCircle2Icon className="size-4" />}
      />
      <DetailList
        title="Nhung viec co the dua vao sprint"
        items={detail?.sprintableWork ?? []}
        icon={<TimerIcon className="size-4" />}
      />
      <DetailList
        title="Nhung viec can thoi gian dai hon sprint"
        items={detail?.longRunningWork ?? []}
        icon={<Clock3Icon className="size-4" />}
      />
      <DetailList
        title="Deliverables cuoi cung"
        items={detail?.deliverables ?? []}
        icon={<FileTextIcon className="size-4" />}
      />
      <DetailList
        title="Chi nen save plan khi..."
        items={detail?.saveReadinessChecks ?? []}
        icon={<ListChecksIcon className="size-4" />}
      />

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-medium">Scaffold Questions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tra loi ngan gon cac cau hoi nay truoc. AI se dung no de lap plan dung template, thay vi tra chat chung chung.
          </p>
        </div>

        <div className="space-y-4">
          {scaffoldFields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium">
                {index + 1}. {field.label}
              </label>
              {field.helperText && (
                <p className="text-xs text-muted-foreground">{field.helperText}</p>
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
                className="w-full resize-y rounded-2xl border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground/70 focus:border-ring/70 focus:ring-2 focus:ring-ring/15"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border bg-muted/20 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Tao plan nhap voi template nay</p>
            <p className="text-xs text-muted-foreground">
              Save plan se chi xuat hien sau khi AI da co du context va draft du 3 phase.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleStart}
            disabled={!allScaffoldsFilled || isStarting}
            className="shrink-0"
          >
            {isStarting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Dang mo chat
              </>
            ) : (
              <>
                <SendHorizonalIcon className="size-4" />
                Tao plan nhap
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<MarketTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [tab, setTab] = React.useState("marketplace")

  React.useEffect(() => {
    let active = true
    fetch("/api/templates")
      .then((response) => response.json())
      .then((data: { templates: MarketTemplate[] }) => {
        if (!active) return
        const nextTemplates = data.templates ?? []
        setTemplates(nextTemplates)
        setSelectedTemplateId((current) => current ?? nextTemplates[0]?.id ?? null)
        setIsLoaded(true)
      })
      .catch(() => {
        if (!active) return
        setTemplates([])
        setIsLoaded(true)
      })

    return () => {
      active = false
    }
  }, [])

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
            Templates
          </h1>
        </div>
        <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
          Moi template o day khong chi la ten mau. Nguoi dung co the xem chi tiet template se lam gi,
          viec nao sprint duoc, viec nao can thoi gian dai hon, roi tra loi scaffold questions truoc khi AI draft plan.
        </p>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList aria-label="Template sections">
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="mine">Template cua toi</TabsTrigger>
            </TabsList>
          </Tabs>
          <Link
            href="/app/templates/editor/new"
            className={buttonVariants({ size: "sm" })}
          >
            Tao template moi
          </Link>
        </div>

        {tab === "mine" ? (
          <MyTemplatesPanel />
        ) : !isLoaded ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-52 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
            <div className="h-[720px] animate-pulse rounded-3xl bg-muted" />
          </div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isActive={template.id === selectedTemplateId}
                  onSelect={(nextTemplate) => setSelectedTemplateId(nextTemplate.id)}
                />
              ))}
            </div>

            <TemplateDetailPane template={selectedTemplate} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            <InboxIcon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">Chua co template nao</p>
            <p className="mt-1 text-xs">
              Template se xuat hien o day khi duoc them vao he thong.
            </p>
          </div>
        )}
      </section>
    </ScrollArea>
  )
}
