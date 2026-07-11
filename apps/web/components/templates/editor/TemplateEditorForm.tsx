"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  GripVerticalIcon,
  InfoIcon,
  LockIcon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { calculateRetroMinutes } from "@/lib/templates/template-guide"

type OutputType = "DOCUMENT" | "SKILL_PRACTICE" | "PROJECT"
type TemplateStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
type ScaffoldQuestionPurpose =
  | "ADJUST_GOAL"
  | "GENERATE_STEPS"
  | "ESTIMATE_TIMEBOX"
  | "IDENTIFY_OBSTACLE"
type CustomRequirementFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "SELECT"
  | "DATE"

type CustomRequirement = {
  id: string
  label: string
  fieldType: CustomRequirementFieldType
  options: string
  required: boolean
  aiHint: string
}

type EditorTemplate = {
  id: string
  title: string
  category: string
  description: string | null
  goalTemplate: string | null
  customRequirements: unknown
  isAcademic: boolean
  domainTags: string[]
  outputType: OutputType
  supportsGroupMode: boolean
  priceVnd: number | null
  status: TemplateStatus
  steps: Array<{
    id: string
    title: string
    guidance: string | null
    estimatedMinutes: number
  }>
  scaffoldQuestions: Array<{
    id: string
    prompt: string
    helperText: string | null
    aiPurpose?: ScaffoldQuestionPurpose | null
  }>
}

type FormState = {
  title: string
  category: string
  description: string
  goalTemplate: string
  isAcademic: boolean
  domainTags: string
  outputType: OutputType
  supportsGroupMode: boolean
  priceVnd: string
  steps: Array<{ title: string; guidance: string; estimatedMinutes: number }>
  scaffoldQuestions: Array<{
    prompt: string
    aiPurpose: ScaffoldQuestionPurpose
  }>
  customRequirements: CustomRequirement[]
}

type GuideContent = {
  title: string
  shouldWrite: string
  howItWorks: string
  example: string
}

const DEFAULT_GOAL_TEMPLATE =
  "Hoàn thành {tên dự án} với {output cụ thể} sẵn sàng gửi đi."

const RETRO_GUIDANCE =
  "So kết quả với Sprint Goal. Ghi 1 điều giữ lại và 1 điều sẽ đổi ở sprint sau."

const WIZARD_STEPS = [
  "Định danh",
  "Goal mẫu",
  "Câu hỏi",
  "Steps",
  "Yêu cầu phụ",
  "Preview",
] as const

const PURPOSE_OPTIONS: Array<{
  value: ScaffoldQuestionPurpose
  label: string
}> = [
  { value: "ADJUST_GOAL", label: "Điều chỉnh goal" },
  { value: "GENERATE_STEPS", label: "Sinh steps" },
  { value: "ESTIMATE_TIMEBOX", label: "Ước lượng timebox" },
  { value: "IDENTIFY_OBSTACLE", label: "Xác định obstacle" },
]

const FIELD_TYPE_OPTIONS: Array<{
  value: CustomRequirementFieldType
  label: string
}> = [
  { value: "TEXT", label: "Text ngắn" },
  { value: "TEXTAREA", label: "Đoạn văn" },
  { value: "NUMBER", label: "Số" },
  { value: "SELECT", label: "Chọn từ danh sách" },
  { value: "DATE", label: "Ngày" },
]

const guideContent: Record<string, GuideContent> = {
  identity: {
    title: "Định danh template",
    shouldWrite:
      "Nói rõ cách làm việc này là gì, dành cho ai và khi nào nên dùng.",
    howItWorks:
      "AI dùng phần bối cảnh, output type, category và tags để hiểu đúng loại sprint cần tạo.",
    example:
      "Ví dụ: Dành cho sinh viên cần biến bài tập lớn thành một sprint có output nộp được.",
  },
  goal: {
    title: "Sprint Goal mẫu",
    shouldWrite:
      "Viết một câu goal có chỗ trống dạng {...} cho phần người dùng sẽ cá nhân hóa.",
    howItWorks:
      "AI dựa vào câu này để chốt goal cụ thể khi người dùng tạo sprint từ template.",
    example: DEFAULT_GOAL_TEMPLATE,
  },
  questions: {
    title: "Scaffold questions",
    shouldWrite:
      "Mỗi câu hỏi nên hỏi một ý và có mục đích AI rõ ràng.",
    howItWorks:
      "Câu trả lời được đưa vào prompt để điều chỉnh goal, steps, timebox hoặc obstacle.",
    example: "Kết thúc sprint này, bạn cầm được gì trong tay?",
  },
  steps: {
    title: "Steps",
    shouldWrite:
      "Mỗi step bắt đầu bằng động từ và mô tả output nhìn thấy được.",
    howItWorks:
      "Steps trở thành checklist trong sprint; guidance được AI cá nhân hóa theo goal.",
    example: "Viết dàn ý chi tiết cho chương 1.",
  },
  requirements: {
    title: "Yêu cầu phụ",
    shouldWrite:
      "Chỉ thêm thông tin thật sự giúp AI tạo sprint tốt hơn.",
    howItWorks:
      "Câu trả lời sẽ được inject vào prompt dạng label, answer và AI hint.",
    example: "Deadline, ngân sách, tông giọng bài viết, ràng buộc kỹ thuật.",
  },
  preview: {
    title: "Preview",
    shouldWrite:
      "Kiểm tra goal, câu hỏi, yêu cầu phụ, steps và retro trước khi lưu.",
    howItWorks:
      "Preview cho thấy các field đang đổ vào sprint cuối như thế nào.",
    example: "Goal mẫu -> câu hỏi -> steps -> Review & Retro.",
  },
}

function FieldHelper({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-5 text-muted-foreground">{children}</p>
}

function GuidePanel({ guide }: { guide: GuideContent }) {
  return (
    <aside className="rounded-lg border bg-background p-5 lg:sticky lg:top-20">
      <div className="mb-4 flex items-center gap-2">
        <InfoIcon className="size-4 text-amber-500" />
        <h2 className="text-base font-semibold">{guide.title}</h2>
      </div>
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        <div>
          <p className="font-medium text-foreground">Nên ghi gì</p>
          <p>{guide.shouldWrite}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">AI/app dùng ra sao</p>
          <p>{guide.howItWorks}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Ví dụ</p>
          <p>{guide.example}</p>
        </div>
      </div>
    </aside>
  )
}

function newRequirement(): CustomRequirement {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    label: "",
    fieldType: "TEXT",
    options: "",
    required: false,
    aiHint: "",
  }
}

function createEmptyState(): FormState {
  return {
    title: "",
    category: "user-template",
    description: "",
    goalTemplate: DEFAULT_GOAL_TEMPLATE,
    isAcademic: false,
    domainTags: "",
    outputType: "PROJECT",
    supportsGroupMode: false,
    priceVnd: "",
    steps: [{ title: "", guidance: "", estimatedMinutes: 30 }],
    scaffoldQuestions: [
      {
        prompt: "Kết thúc sprint này, bạn cầm được gì trong tay?",
        aiPurpose: "ADJUST_GOAL",
      },
      {
        prompt: "Điều gì dễ khiến bạn bỏ dở nhất?",
        aiPurpose: "IDENTIFY_OBSTACLE",
      },
    ],
    customRequirements: [],
  }
}

function parseCustomRequirements(value: unknown): CustomRequirement[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const label = typeof record.label === "string" ? record.label : ""
      const fieldType = FIELD_TYPE_OPTIONS.some(
        (option) => option.value === record.fieldType
      )
        ? (record.fieldType as CustomRequirementFieldType)
        : "TEXT"
      const options = Array.isArray(record.options)
        ? record.options.filter((option) => typeof option === "string").join(", ")
        : ""
      const aiHint = typeof record.aiHint === "string" ? record.aiHint : ""
      const id = typeof record.id === "string" ? record.id : newRequirement().id

      return {
        id,
        label,
        fieldType,
        options,
        required:
          typeof record.required === "boolean" ? record.required : false,
        aiHint,
      }
    })
    .filter((item): item is CustomRequirement => item !== null)
}

function toFormState(template: EditorTemplate | null): FormState {
  if (!template) return createEmptyState()

  return {
    title: template.title,
    category: template.category,
    description: template.description ?? "",
    goalTemplate: template.goalTemplate ?? "",
    isAcademic: template.isAcademic,
    domainTags: template.domainTags.join(", "),
    outputType: template.outputType,
    supportsGroupMode: template.supportsGroupMode,
    priceVnd: template.priceVnd ? String(template.priceVnd) : "",
    steps:
      template.steps.length > 0
        ? template.steps.map((step) => ({
            title: step.title,
            guidance: step.guidance ?? "",
            estimatedMinutes: step.estimatedMinutes,
          }))
        : [{ title: "", guidance: "", estimatedMinutes: 30 }],
    scaffoldQuestions: template.scaffoldQuestions.map((question) => ({
      prompt: question.prompt,
      aiPurpose: question.aiPurpose ?? "GENERATE_STEPS",
    })),
    customRequirements: parseCustomRequirements(template.customRequirements),
  }
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items
  }

  const next = [...items]
  const [item] = next.splice(from, 1)
  if (!item) return items
  next.splice(to, 0, item)
  return next
}

function splitOptions(value: string) {
  return value
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean)
}

async function readJsonResponse<T extends { error?: string }>(
  response: Response
): Promise<T> {
  const text = await response.text()
  if (!text) return {} as T

  try {
    return JSON.parse(text) as T
  } catch {
    return {
      error: response.ok
        ? "Phản hồi server không đúng định dạng JSON."
        : "Server trả về lỗi không đúng định dạng JSON.",
    } as T
  }
}

export function TemplateEditorForm({
  template,
}: {
  template: EditorTemplate | null
}) {
  const router = useRouter()
  const draftKey = `lockin-template-guide:${template?.id ?? "new"}`
  const [form, setForm] = React.useState<FormState>(() => toFormState(template))
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasLoadedDraft, setHasLoadedDraft] = React.useState(false)
  const [draggedStep, setDraggedStep] = React.useState<number | null>(null)
  const [draggedRequirement, setDraggedRequirement] = React.useState<number | null>(null)

  React.useEffect(() => {
    const base = toFormState(template)
    const saved =
      typeof window !== "undefined" ? window.localStorage.getItem(draftKey) : null

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          form?: FormState
          currentStep?: number
        }
        setForm(parsed.form ?? base)
        setCurrentStep(
          typeof parsed.currentStep === "number"
            ? Math.min(Math.max(parsed.currentStep, 0), WIZARD_STEPS.length - 1)
            : 0
        )
      } catch {
        setForm(base)
        setCurrentStep(0)
      }
    } else {
      setForm(base)
      setCurrentStep(0)
    }

    setHasLoadedDraft(true)
  }, [draftKey, template])

  React.useEffect(() => {
    if (!hasLoadedDraft || typeof window === "undefined") return

    window.localStorage.setItem(
      draftKey,
      JSON.stringify({ form, currentStep, savedAt: new Date().toISOString() })
    )
  }, [currentStep, draftKey, form, hasLoadedDraft])

  const previewSteps =
    form.steps.length > 0
      ? form.steps
      : [{ title: "Tạo output đầu tiên", guidance: "", estimatedMinutes: 30 }]
  const previewMinutes = previewSteps.reduce(
    (total, step) => total + (Number(step.estimatedMinutes) || 0),
    0
  )
  const retroMinutes = calculateRetroMinutes(
    previewSteps.map((step) => Number(step.estimatedMinutes) || 0)
  )
  const totalMinutes = previewMinutes + retroMinutes
  const fallbackGuide: GuideContent = {
    title: "Template Guide",
    shouldWrite: "Điền từng bước để tạo template cá nhân.",
    howItWorks: "App lưu nháp cục bộ và dùng dữ liệu này khi tạo sprint.",
    example: DEFAULT_GOAL_TEMPLATE,
  }
  const activeGuide: GuideContent =
    currentStep === 0
      ? (guideContent.identity ?? fallbackGuide)
      : currentStep === 1
        ? (guideContent.goal ?? fallbackGuide)
        : currentStep === 2
          ? (guideContent.questions ?? fallbackGuide)
          : currentStep === 3
            ? (guideContent.steps ?? fallbackGuide)
            : currentStep === 4
              ? (guideContent.requirements ?? fallbackGuide)
              : (guideContent.preview ?? fallbackGuide)

  const payload = {
    title: form.title.trim(),
    category: form.category.trim(),
    description: form.description.trim(),
    goalTemplate: form.goalTemplate.trim(),
    isAcademic: form.isAcademic,
    domainTags: form.domainTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    outputType: form.outputType,
    supportsGroupMode: form.supportsGroupMode,
    priceVnd: form.priceVnd.trim() ? Number(form.priceVnd) : null,
    steps: form.steps.map((step) => ({
      title: step.title.trim(),
      guidance: step.guidance.trim() || null,
      estimatedMinutes: Number(step.estimatedMinutes) || 30,
    })),
    scaffoldQuestions: form.scaffoldQuestions
      .filter((question) => question.prompt.trim())
      .map((question) => ({
        prompt: question.prompt.trim(),
        helperText:
          PURPOSE_OPTIONS.find((option) => option.value === question.aiPurpose)
            ?.label ?? null,
        aiPurpose: question.aiPurpose,
      })),
    customRequirements: form.customRequirements.map((requirement, index) => ({
      id: requirement.id,
      label: requirement.label.trim(),
      fieldType: requirement.fieldType,
      options:
        requirement.fieldType === "SELECT"
          ? splitOptions(requirement.options)
          : [],
      required: requirement.required,
      aiHint: requirement.aiHint.trim(),
      order: index + 1,
    })),
  }

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      if (!form.title.trim()) return "Bạn cần nhập tên template."
      if (!form.description.trim()) return "Bạn cần nhập mô tả / bối cảnh."
    }

    if (stepIndex === 1 && !form.goalTemplate.trim()) {
      return "Bạn cần nhập Sprint Goal mẫu."
    }

    if (stepIndex === 3) {
      if (form.steps.length < 1) return "Template cần ít nhất 1 step."
      const invalidStep = form.steps.findIndex(
        (step) =>
          !step.title.trim() ||
          Number(step.estimatedMinutes) < 5 ||
          Number(step.estimatedMinutes) > 120
      )
      if (invalidStep >= 0) {
        return `Step ${invalidStep + 1} cần tên và timebox từ 5 đến 120 phút.`
      }
    }

    if (stepIndex === 4) {
      const invalidRequirement = form.customRequirements.findIndex(
        (requirement) => {
          if (!requirement.label.trim() || !requirement.aiHint.trim()) {
            return true
          }
          return (
            requirement.fieldType === "SELECT" &&
            splitOptions(requirement.options).length < 2
          )
        }
      )

      if (invalidRequirement >= 0) {
        return `Yêu cầu phụ ${invalidRequirement + 1} cần label, AI hint và SELECT phải có ít nhất 2 options.`
      }
    }

    return null
  }

  const validateAll = () => {
    for (let index = 0; index < WIZARD_STEPS.length; index += 1) {
      const message = validateStep(index)
      if (message) {
        setCurrentStep(index)
        return message
      }
    }

    return null
  }

  const goNext = () => {
    const message = validateStep(currentStep)
    if (message) {
      setError(message)
      return
    }

    setError(null)
    setCurrentStep((step) => Math.min(step + 1, WIZARD_STEPS.length - 1))
  }

  const saveTemplate = async (options: { redirect?: boolean } = {}) => {
    const shouldRedirect = options.redirect ?? true
    const message = validateAll()
    if (message) {
      setError(message)
      return null
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(
        template ? `/api/templates/mine/${template.id}` : "/api/templates/mine",
        {
          method: template ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const data = await readJsonResponse<{
        error?: string
        template?: EditorTemplate
      }>(response)
      if (!response.ok) {
        throw new Error(data.error ?? "Không thể lưu template.")
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftKey)
      }

      if (!data.template) {
        throw new Error("Server không trả về template vừa lưu.")
      }

      const nextTemplate = data.template
      if (shouldRedirect) {
        router.push(`/app/templates/editor/${nextTemplate.id}`)
      }
      router.refresh()
      return nextTemplate
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Đã có lỗi xảy ra."
      )
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const submitForReview = async () => {
    if (!template) {
      await saveTemplate()
      return
    }

    const message = validateAll()
    if (message) {
      setError(message)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const savedTemplate = await saveTemplate({ redirect: false })
      if (!savedTemplate) return

      const response = await fetch(`/api/templates/mine/${template.id}/submit`, {
        method: "POST",
      })
      const data = await readJsonResponse<{ error?: string }>(response)

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể gửi duyệt.")
      }

      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Đã có lỗi xảy ra."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const suggestGoal = () => {
    const outputLabel =
      form.outputType === "DOCUMENT"
        ? "tài liệu cụ thể"
        : form.outputType === "SKILL_PRACTICE"
          ? "bài luyện kỹ năng có thể đánh giá"
          : "output cụ thể"

    setForm((current) => ({
      ...current,
      goalTemplate:
        current.goalTemplate.trim() || `Hoàn thành {tên công việc} với {${outputLabel}} sẵn sàng sử dụng.`,
    }))
  }

  const suggestSteps = () => {
    setForm((current) => ({
      ...current,
      steps:
        current.steps.length > 1 || current.steps[0]?.title.trim()
          ? current.steps
          : [
              {
                title: "Xác định output cần bàn giao",
                guidance:
                  "Sau khi đọc goal, viết rõ output cuối và tiêu chí hoàn thành trước tiên.",
                estimatedMinutes: 25,
              },
              {
                title: "Phác thảo cấu trúc thực hiện",
                guidance:
                  "Khi đã có output, chia thành các phần nhỏ có thể kiểm tra được.",
                estimatedMinutes: 30,
              },
              {
                title: "Tạo bản nháp đầu tiên",
                guidance:
                  "Sau khi có cấu trúc, làm bản nháp đủ nhìn thấy thay vì tối ưu quá sớm.",
                estimatedMinutes: 30,
              },
              {
                title: "Kiểm tra và chốt bản gửi đi",
                guidance:
                  "Khi bản nháp xong, so lại với goal và sửa phần thiếu rõ nhất.",
                estimatedMinutes: 25,
              },
            ],
    }))
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Template Guide</p>
            <h1 className="text-2xl font-semibold">
              {WIZARD_STEPS[currentStep]}
            </h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push("/app/templates")}
            disabled={isSaving || isSubmitting}
          >
            <XIcon className="size-4" />
            Thoát
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-6 gap-2">
          {WIZARD_STEPS.map((step, index) => (
            <button
              key={step}
              type="button"
              className={`h-2 rounded-full transition ${
                index <= currentStep ? "bg-primary" : "bg-muted"
              }`}
              aria-label={step}
              onClick={() => {
                const message = validateStep(currentStep)
                if (index > currentStep && message) {
                  setError(message)
                  return
                }
                setError(null)
                setCurrentStep(index)
              }}
            />
          ))}
        </div>

        <section className="rounded-lg border bg-background p-5 md:p-6">
          {currentStep === 0 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Cách làm việc này là gì?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Đặt tên, bối cảnh và loại output để AI hiểu template này nên
                  tạo sprint kiểu nào.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tên template</label>
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
                <FieldHelper>
                  Bạn điền tên template → app dùng để hiển thị khi chọn
                  template → người dùng nhận ra đúng cách làm việc.
                </FieldHelper>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả / Bối cảnh</label>
                <Textarea
                  rows={5}
                  placeholder="Cách làm việc này dành cho việc gì, phù hợp với ai, khi nào nên dùng."
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <FieldHelper>
                  Bạn điền bối cảnh → AI đọc để hiểu tình huống → steps sinh ra
                  sát mục tiêu người dùng.
                </FieldHelper>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Output type</label>
                  <Select
                    value={form.outputType}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        outputType: value as OutputType,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROJECT">Project</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                      <SelectItem value="SKILL_PRACTICE">
                        Skill practice
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldHelper>
                    Bạn chọn output type → AI biết kết quả cuối thuộc loại gì →
                    steps ra đúng loại output.
                  </FieldHelper>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  />
                  <FieldHelper>
                    Bạn điền category → app dùng để phân nhóm → template dễ tìm
                    trong thư viện.
                  </FieldHelper>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Price VND</label>
                  <Input
                    inputMode="numeric"
                    value={form.priceVnd}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priceVnd: event.target.value,
                      }))
                    }
                  />
                  <FieldHelper>
                    Bạn điền giá → app dùng cho phân phối template → người dùng
                    biết template miễn phí hay trả phí.
                  </FieldHelper>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tags (phân tách bằng dấu phẩy)
                </label>
                <Input
                  value={form.domainTags}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      domainTags: event.target.value,
                    }))
                  }
                />
                <FieldHelper>
                  Bạn điền tags → AI/app dùng để nhận diện chủ đề → sprint được
                  gợi ý theo đúng miền công việc.
                </FieldHelper>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Kết thúc sprint, người dùng cầm được gì trong tay?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Goal mẫu là một câu, có thể dùng chỗ trống dạng {"{...}"}.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal mẫu</label>
                <Input
                  maxLength={200}
                  value={form.goalTemplate}
                  placeholder={DEFAULT_GOAL_TEMPLATE}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      goalTemplate: event.target.value,
                    }))
                  }
                />
                <FieldHelper>
                  Bạn điền goal mẫu → AI dùng để chốt goal cụ thể → sprint có
                  đích đến rõ ràng, đo được.
                </FieldHelper>
              </div>
              <Button variant="outline" onClick={suggestGoal}>
                <SparklesIcon className="size-4" />
                AI gợi ý từ mô tả
              </Button>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Trước khi bắt đầu, người dùng cần được hỏi gì?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hai câu mặc định có thể xóa hoặc sửa tùy template.
                </p>
              </div>

              <div className="space-y-4">
                {form.scaffoldQuestions.map((question, index) => (
                  <div key={`${index}-${question.prompt}`} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Câu hỏi {index + 1}</p>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            scaffoldQuestions:
                              current.scaffoldQuestions.filter(
                                (_, itemIndex) => itemIndex !== index
                              ),
                          }))
                        }
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                      <div className="space-y-2">
                        <Input
                          placeholder="Câu hỏi"
                          value={question.prompt}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              scaffoldQuestions:
                                current.scaffoldQuestions.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, prompt: event.target.value }
                                    : item
                                ),
                            }))
                          }
                        />
                        <FieldHelper>
                          Bạn điền câu hỏi → người dùng trả lời trước khi bắt
                          đầu → AI có dữ liệu thật để tạo sprint.
                        </FieldHelper>
                      </div>
                      <div className="space-y-2">
                        <Select
                          value={question.aiPurpose}
                          onValueChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              scaffoldQuestions:
                                current.scaffoldQuestions.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        aiPurpose:
                                          value as ScaffoldQuestionPurpose,
                                      }
                                    : item
                                ),
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PURPOSE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldHelper>
                          Bạn chọn mục đích → AI dùng câu trả lời đúng vai trò
                          → sprint cá nhân hóa đúng phần cần chỉnh.
                        </FieldHelper>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      scaffoldQuestions: [
                        ...current.scaffoldQuestions,
                        { prompt: "", aiPurpose: "GENERATE_STEPS" },
                      ],
                    }))
                  }
                >
                  <PlusIcon className="size-4" />
                  Thêm câu hỏi
                </Button>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Các bước làm - mỗi bước một output nhìn thấy được.
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kéo thả để sắp xếp. Retro không lưu trong steps, chỉ tự
                    append khi tạo sprint.
                  </p>
                </div>
                <Button variant="outline" onClick={suggestSteps}>
                  <SparklesIcon className="size-4" />
                  AI đề xuất steps
                </Button>
              </div>

              <div className="space-y-4">
                {form.steps.map((step, index) => (
                  <div
                    key={`${index}-${step.title}`}
                    className="rounded-lg border p-4"
                    draggable
                    onDragStart={() => setDraggedStep(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedStep === null) return
                      setForm((current) => ({
                        ...current,
                        steps: moveItem(current.steps, draggedStep, index),
                      }))
                      setDraggedStep(null)
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <GripVerticalIcon className="size-4 text-muted-foreground" />
                        Step {index + 1}
                      </div>
                      {form.steps.length > 1 ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              steps: current.steps.filter(
                                (_, itemIndex) => itemIndex !== index
                              ),
                            }))
                          }
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <div className="space-y-2">
                        <Input
                          placeholder="Viết dàn ý chi tiết cho chương 1"
                          value={step.title}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              steps: current.steps.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, title: event.target.value }
                                  : item
                              ),
                            }))
                          }
                        />
                        <FieldHelper>
                          Bạn điền tên step → app dùng làm checklist → người
                          dùng thấy output cần hoàn thành.
                        </FieldHelper>
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          rows={3}
                          placeholder="Sau khi mở tài liệu, viết 3 ý chính trước rồi mới chi tiết hóa."
                          value={step.guidance}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              steps: current.steps.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, guidance: event.target.value }
                                  : item
                              ),
                            }))
                          }
                        />
                        <FieldHelper>
                          Bạn điền guidance → AI cá nhân hóa theo goal từng
                          người → người dùng biết làm gì trước tiên.
                        </FieldHelper>
                      </div>
                      <div className="max-w-48 space-y-2">
                        <Input
                          type="number"
                          min={5}
                          max={120}
                          value={String(step.estimatedMinutes)}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              steps: current.steps.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      estimatedMinutes:
                                        Number(event.target.value) || 30,
                                    }
                                  : item
                              ),
                            }))
                          }
                        />
                        <FieldHelper>
                          Bạn điền timebox → sprint đếm ngược theo số này →
                          người dùng có giới hạn thời gian.
                        </FieldHelper>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      steps: [
                        ...current.steps,
                        { title: "", guidance: "", estimatedMinutes: 30 },
                      ],
                    }))
                  }
                >
                  <PlusIcon className="size-4" />
                  Thêm step
                </Button>

                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <LockIcon className="size-4 text-muted-foreground" />
                    Review & Retro
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Thêm tự động vào cuối mọi sprint. Bạn không cần điền.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Guidance cố định: {RETRO_GUIDANCE}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Template của bạn cần thông tin gì thêm?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Các field này sẽ hiện sau scaffold questions khi tạo sprint
                  từ template.
                </p>
              </div>

              <div className="space-y-4">
                {form.customRequirements.map((requirement, index) => (
                  <div
                    key={requirement.id}
                    className="rounded-lg border p-4"
                    draggable
                    onDragStart={() => setDraggedRequirement(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedRequirement === null) return
                      setForm((current) => ({
                        ...current,
                        customRequirements: moveItem(
                          current.customRequirements,
                          draggedRequirement,
                          index
                        ),
                      }))
                      setDraggedRequirement(null)
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <GripVerticalIcon className="size-4 text-muted-foreground" />
                        Yêu cầu {index + 1}
                      </div>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            customRequirements:
                              current.customRequirements.filter(
                                (_, itemIndex) => itemIndex !== index
                              ),
                          }))
                        }
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Label</label>
                        <Input
                          placeholder="Deadline"
                          value={requirement.label}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              customRequirements:
                                current.customRequirements.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, label: event.target.value }
                                      : item
                                ),
                            }))
                          }
                        />
                        <FieldHelper>
                          Bạn điền label → người dùng thấy tên field khi tạo
                          sprint → câu trả lời có ngữ cảnh rõ.
                        </FieldHelper>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Loại</label>
                        <Select
                          value={requirement.fieldType}
                          onValueChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              customRequirements:
                                current.customRequirements.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          fieldType:
                                            value as CustomRequirementFieldType,
                                        }
                                      : item
                                ),
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldHelper>
                          Bạn chọn loại → app render đúng ô nhập → người dùng
                          trả lời nhanh và đúng dạng.
                        </FieldHelper>
                      </div>
                      {requirement.fieldType === "SELECT" ? (
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">
                            Options (phân tách bằng dấu phẩy)
                          </label>
                          <Input
                            placeholder="Nhanh, Cân bằng, Kỹ lưỡng"
                            value={requirement.options}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                customRequirements:
                                  current.customRequirements.map(
                                    (item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            options: event.target.value,
                                          }
                                        : item
                                  ),
                              }))
                            }
                          />
                          <FieldHelper>
                            Bạn điền options → app tạo danh sách chọn → AI nhận
                            câu trả lời nhất quán hơn.
                          </FieldHelper>
                        </div>
                      ) : null}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">AI hint</label>
                        <Input
                          placeholder="Điều chỉnh phạm vi steps theo deadline."
                          value={requirement.aiHint}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              customRequirements:
                                current.customRequirements.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, aiHint: event.target.value }
                                      : item
                                ),
                            }))
                          }
                        />
                        <FieldHelper>
                          Bạn điền AI hint → AI biết dùng câu trả lời thế nào →
                          sprint tránh thu thập thông tin vô nghĩa.
                        </FieldHelper>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={requirement.required}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              customRequirements:
                                current.customRequirements.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          required: event.target.checked,
                                        }
                                      : item
                                ),
                            }))
                          }
                        />
                        Bắt buộc trả lời
                      </label>
                    </div>
                  </div>
                ))}

                {form.customRequirements.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Chưa có yêu cầu phụ. Template vẫn lưu được; chỉ thêm khi
                    thông tin đó thật sự giúp AI tạo sprint tốt hơn.
                  </p>
                ) : null}

                <Button
                  variant="outline"
                  disabled={form.customRequirements.length >= 10}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      customRequirements: [
                        ...current.customRequirements,
                        newRequirement(),
                      ],
                    }))
                  }
                >
                  <PlusIcon className="size-4" />
                  Thêm yêu cầu
                </Button>
              </div>
            </div>
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Sprint tạo từ template này sẽ trông như thế này
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Preview cập nhật theo dữ liệu bạn đã nhập.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Sprint Goal
                </p>
                <p className="mt-2 text-sm font-medium">
                  {form.goalTemplate.trim() || DEFAULT_GOAL_TEMPLATE}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">Câu hỏi sẽ hỏi</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {form.scaffoldQuestions.map((question, index) => (
                    <p key={`${index}-${question.prompt}`}>
                      {index + 1}. {question.prompt || "Câu hỏi chưa đặt"} -{" "}
                      {
                        PURPOSE_OPTIONS.find(
                          (option) => option.value === question.aiPurpose
                        )?.label
                      }
                    </p>
                  ))}
                  {form.customRequirements.map((requirement, index) => (
                    <p key={requirement.id}>
                      {form.scaffoldQuestions.length + index + 1}.{" "}
                      {requirement.label || "Yêu cầu phụ chưa đặt"} -{" "}
                      {FIELD_TYPE_OPTIONS.find(
                        (option) => option.value === requirement.fieldType
                      )?.label}
                      {requirement.required ? " - bắt buộc" : ""}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {previewSteps.map((step, index) => (
                  <div key={`preview-${index}`} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {index + 1}. {step.title.trim() || "Tên step"}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {step.guidance.trim() ||
                            "Guidance sẽ xuất hiện ở đây sau khi bạn điền."}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {Number(step.estimatedMinutes) || 30} phút
                      </span>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <LockIcon className="size-4 text-muted-foreground" />
                        {previewSteps.length + 1}. Review & Retro
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {RETRO_GUIDANCE}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-background px-2 py-1 text-xs text-muted-foreground">
                      {retroMinutes} phút
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Tổng thời lượng dự kiến: {totalMinutes} phút.
              </p>
            </div>
          ) : null}
        </section>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setError(null)
              setCurrentStep((step) => Math.max(step - 1, 0))
            }}
            disabled={currentStep === 0 || isSaving || isSubmitting}
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>

          <div className="flex flex-wrap gap-3">
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button onClick={goNext} disabled={isSaving || isSubmitting}>
                Tiếp tục
                <ArrowRightIcon className="size-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(0)}
                  disabled={isSaving || isSubmitting}
                >
                  Quay lại sửa
                </Button>
                <Button
                  onClick={() => void saveTemplate()}
                  disabled={isSaving || isSubmitting}
                >
                  <SaveIcon className="size-4" />
                  Lưu template
                </Button>
                {template ? (
                  <Button
                    variant="outline"
                    onClick={() => void submitForReview()}
                    disabled={isSaving || isSubmitting}
                  >
                    Gửi duyệt
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <GuidePanel guide={activeGuide} />
    </div>
  )
}
