"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChart3Icon,
  BellRingIcon,
  CheckIcon,
  CheckCircle2Icon,
  CircleIcon,
  Clock3Icon,
  ExternalLinkIcon,
  LockKeyholeIcon,
  MessageSquareIcon,
  PlayIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { getRoadmapFeature, roadmapCheckpointPlans } from "../mock-data"

const aiTasks = [
  { id: "outline", title: "Lập dàn ý chương 1", minutes: 25, priority: "High" },
  { id: "quiz", title: "Làm quiz kiến thức", minutes: 35, priority: "High" },
  { id: "reflection", title: "Viết reflection", minutes: 20, priority: "Medium" },
]

const mockTemplates = [
  { id: "exam", title: "Exam Sprint", author: "LockIn Studio", tasks: 12, duration: "7 days", installs: "1.2k" },
  { id: "capstone", title: "Capstone Plan", author: "Mina Tran", tasks: 18, duration: "14 days", installs: "842" },
  { id: "deep-work", title: "Deep Work Week", author: "Khai Nguyen", tasks: 9, duration: "5 days", installs: "634" },
]

const teamTasks = [
  { id: "research", title: "Tổng hợp research", owner: "An", done: true },
  { id: "slides", title: "Thiết kế slide demo", owner: "Minh", done: false },
  { id: "script", title: "Viết kịch bản thuyết trình", owner: "Linh", done: false },
]

function DemoShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ featureId: string }>()
  const featureId = Array.isArray(params.featureId) ? params.featureId[0] : params.featureId
  const feature = getRoadmapFeature(featureId)

  if (!feature) {
    return <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto"><main className="mx-auto mt-12 w-full max-w-3xl px-4 py-8"><Card><CardHeader><CardTitle>Demo không tồn tại</CardTitle></CardHeader><CardFooter><Button nativeButton={false} render={<Link href="/app/roadmap" />}>Quay lại roadmap</Button></CardFooter></Card></main></ScrollArea>
  }

  const Icon = feature.icon
  const checkpoint = roadmapCheckpointPlans[feature.id]
  const navItems = ["Workspace", "Plans", "Focus", "Insights"]
  return (
    <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background text-foreground">
      <main className="mx-auto mt-12 w-full max-w-6xl px-4 py-8 pb-16 lg:px-8">
        <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
          <header className="flex h-12 items-center justify-between border-b px-4">
            <div className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><Icon /></span><span className="text-sm font-semibold">LockIn Labs</span><Badge variant="secondary">Mock workspace</Badge></div>
            <div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:block">Demo data · not synced</span><span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">MT</span></div>
          </header>
          <div className="grid min-h-[680px] md:grid-cols-[190px_minmax(0,1fr)]">
            <aside className="hidden border-r bg-muted/30 p-3 md:flex md:flex-col md:gap-1">
              {navItems.map((item) => <button key={item} type="button" disabled className="rounded-md px-3 py-2 text-left text-sm text-muted-foreground disabled:cursor-default disabled:opacity-70">{item}</button>)}
              <div className="mt-auto rounded-md border bg-background p-3"><p className="text-xs font-medium">Prototype mode</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Các thao tác chỉ thay đổi mock state.</p></div>
            </aside>
            <section className="min-w-0 p-4 sm:p-6">
              <div className="mb-6 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-muted"><Icon /></span><div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold">{feature.demoTitle}</h1><Badge variant={feature.stage === "Now" ? "default" : "outline"}>{feature.stage}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{feature.demoSummary}</p></div></div>
                <div className="flex items-center gap-3"><Button nativeButton={false} render={<Link href="/app/roadmap" />} variant="outline" size="sm"><ArrowLeftIcon data-icon="inline-start" />Roadmap</Button><div className="hidden min-w-28 sm:block"><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Readiness</span><span>{feature.progress}%</span></div><Progress value={feature.progress} /></div></div>
              </div>
              {children}
              <section className="mt-6 border-t pt-5">
                <div className="mb-4 flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Checkpoint plan</p>
                  <h2 className="text-base font-semibold">{checkpoint.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{checkpoint.purpose}</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-md border bg-muted/20 p-4">
                    <p className="mb-3 text-sm font-medium">Cách tiếp cận</p>
                    <div className="flex flex-col gap-2">
                      {checkpoint.approach.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm">
                          <CheckCircle2Icon className="mt-0.5 shrink-0 text-primary" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-4">
                    <p className="mb-3 text-sm font-medium">Cải tiến tiếp theo</p>
                    <div className="flex flex-col gap-2">
                      {checkpoint.improvements.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm">
                          <SparklesIcon className="mt-0.5 shrink-0 text-primary" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-4">
                    <p className="mb-3 text-sm font-medium">Vướng mắc</p>
                    <div className="flex flex-col gap-2">
                      {checkpoint.blockers.map((item) => (
                        <div key={item} className="rounded-md border bg-background p-2 text-sm leading-5 text-muted-foreground">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-4">
                    <p className="mb-3 text-sm font-medium">Cách tháo gỡ</p>
                    <div className="flex flex-col gap-2">
                      {checkpoint.unblockers.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm">
                          <CheckIcon className="mt-0.5 shrink-0 text-primary" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              <section className="mt-6 border-t pt-5"><p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">Included in this phase</p><div className="grid gap-2 lg:grid-cols-2">{feature.modules.map((module) => <div key={module.name} className="flex items-start justify-between gap-3 rounded-md border bg-muted/20 p-3"><div><p className="text-sm font-medium">{module.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{module.description}</p></div><Badge variant={module.status === "Prototype" ? "default" : "outline"}>{module.status}</Badge></div>)}</div></section>
            </section>
          </div>
        </div>
      </main>
    </ScrollArea>
  )
}

function AiPlanningDemo() {
  const [generated, setGenerated] = React.useState(false)
  const [completed, setCompleted] = React.useState<string[]>([])
  const toggleTask = (id: string) => setCompleted((current) => current.includes(id) ? current.filter((taskId) => taskId !== id) : [...current, id])
  return <DemoShell><section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]"><Card className="rounded-lg"><CardHeader><CardTitle>Mục tiêu mẫu</CardTitle><CardDescription>“Hoàn thành ôn thi EXE101 trước ngày 18/08.”</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><Badge variant="secondary" className="w-fit">Deadline · 18 Aug</Badge><div className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Available time</p><p className="mt-1 font-medium">90 min/day</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Confidence</p><p className="mt-1 font-medium">Medium</p></div></div><p className="text-sm text-muted-foreground">AI sẽ ưu tiên phần lý thuyết có trọng số cao và dành một sprint cho quiz tự kiểm tra.</p></CardContent><CardFooter><Button onClick={() => setGenerated(true)}><SparklesIcon data-icon="inline-start" />{generated ? "Tạo lại plan" : "Generate plan"}</Button></CardFooter></Card><Card className="rounded-lg"><CardHeader><CardTitle>{generated ? "Sprint đề xuất" : "Plan preview"}</CardTitle><CardDescription>{generated ? "3 task được sắp xếp theo mức độ ưu tiên, tổng 80 phút cho hôm nay." : "Nhấn Generate plan để nhận các task mẫu."}</CardDescription></CardHeader><CardContent className="flex flex-col gap-2">{generated ? aiTasks.map((task, index) => { const isDone = completed.includes(task.id); return <button key={task.id} type="button" onClick={() => toggleTask(task.id)} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-left hover:bg-accent"><span className="flex min-w-0 items-center gap-3">{isDone ? <CheckCircle2Icon className="shrink-0 text-primary" /> : <CircleIcon className="shrink-0 text-muted-foreground" />}<span><span className="block text-sm font-medium">{index + 1}. {task.title}</span><span className="text-xs text-muted-foreground">{task.minutes} phút · {task.priority} priority</span></span></span><Badge variant="outline">Sprint 1</Badge></button> }) : <p className="py-7 text-center text-sm text-muted-foreground">Kế hoạch sẽ xuất hiện ở đây.</p>}</CardContent></Card></section></DemoShell>
}

function FocusGuardDemo() {
  const [running, setRunning] = React.useState(false)
  const [hardBlock, setHardBlock] = React.useState(true)
  return <DemoShell><section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><Card className="rounded-lg"><CardHeader><CardTitle>Deep work session</CardTitle><CardDescription>Ôn chương 1 EXE101 · 45 phút</CardDescription></CardHeader><CardContent className="flex flex-col items-center gap-4 py-8"><div className="flex flex-wrap justify-center gap-2"><Badge variant="outline">Deep Work</Badge><Badge variant="secondary">No breaks</Badge><Badge variant="outline">1 task selected</Badge></div><p className="text-5xl font-semibold tracking-tight">{running ? "44:59" : "45:00"}</p><Badge variant={running ? "default" : "secondary"}>{running ? "Focus session đang chạy" : "Sẵn sàng bắt đầu"}</Badge></CardContent><CardFooter><Button className="w-full" onClick={() => setRunning((current) => !current)}>{running ? <><Clock3Icon data-icon="inline-start" />Tạm dừng</> : <><PlayIcon data-icon="inline-start" />Bắt đầu focus</>}</Button></CardFooter></Card><Card className="rounded-lg"><CardHeader><CardTitle>Website guard</CardTitle><CardDescription>Chính sách chặn được áp dụng trong phiên focus mẫu này.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex items-center justify-between gap-4 rounded-lg border p-3"><div className="flex items-center gap-3"><ShieldCheckIcon className="text-primary" /><div><p className="text-sm font-medium">{hardBlock ? "Hard block enabled" : "Soft block only"}</p><p className="text-xs text-muted-foreground">{hardBlock ? "Không thể mở website bị chặn." : "Hiển thị lời nhắc trước khi tiếp tục."}</p></div></div><Button size="sm" variant="outline" onClick={() => setHardBlock((current) => !current)}>Đổi chế độ</Button></div><div className="flex flex-col gap-2">{["facebook.com", "youtube.com", "reddit.com"].map((domain) => <div key={domain} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{domain}</span><Badge variant="secondary">Blocked</Badge></div>)}</div><div className="flex items-center gap-2 text-xs text-muted-foreground"><ExternalLinkIcon />docs.google.com đang ở whitelist</div></CardContent></Card></section></DemoShell>
}

function MarketplaceDemo() {
  const [selectedId, setSelectedId] = React.useState("exam")
  const [installed, setInstalled] = React.useState(false)
  const selected = mockTemplates.find((template) => template.id === selectedId) ?? mockTemplates[0]!
  return <DemoShell><section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><div className="grid gap-3">{mockTemplates.map((template) => <button key={template.id} type="button" onClick={() => { setSelectedId(template.id); setInstalled(false) }} className={`rounded-lg border p-4 text-left transition hover:bg-accent ${selectedId === template.id ? "border-ring ring-2 ring-ring/20" : ""}`}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{template.title}</p><p className="mt-1 text-sm text-muted-foreground">by {template.author}</p></div><Badge variant="secondary">{template.installs} installs</Badge></div><p className="mt-4 text-xs text-muted-foreground">{template.tasks} tasks · {template.duration}</p></button>)}</div><Card className="rounded-lg"><CardHeader><CardTitle>{selected.title}</CardTitle><CardDescription>Preview các đầu việc sẽ được thêm vào plan mới.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{["Chuẩn bị mục tiêu và tài liệu", "Hoàn thành sprint trọng tâm", "Tự review kết quả"].map((step, index) => <div key={step} className="flex items-center gap-3 rounded-lg border p-3 text-sm"><Badge variant="outline">{index + 1}</Badge>{step}</div>)}</CardContent><CardFooter className="flex-col items-stretch gap-3"><Button onClick={() => setInstalled(true)}>{installed ? <><CheckIcon data-icon="inline-start" />Đã thêm vào workspace</> : <><PlusIcon data-icon="inline-start" />Thêm template</>}</Button>{installed && <p className="text-center text-xs text-muted-foreground">Plan mẫu đã sẵn sàng để bạn chỉnh sửa.</p>}</CardFooter></Card></section></DemoShell>
}

function InsightsDemo() {
  const [range, setRange] = React.useState("week")
  const data = range === "week" ? [42, 68, 55, 78, 64, 38, 24] : [55, 63, 72, 61, 84, 76, 58]
  return <DemoShell><section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><Card className="rounded-lg"><CardHeader><CardTitle>Focus rhythm</CardTitle><CardDescription>Thời gian tập trung theo mock data.</CardDescription></CardHeader><CardContent className="flex flex-col gap-5"><Tabs value={range} onValueChange={(value) => value && setRange(value)}><TabsList><TabsTrigger value="week">Tuần này</TabsTrigger><TabsTrigger value="previous">Tuần trước</TabsTrigger></TabsList></Tabs><div className="flex h-44 items-end gap-2" aria-label="Focus time chart">{data.map((value, index) => <div key={`${range}-${index}`} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-primary/80" style={{ height: `${value}%` }} /><span className="text-xs text-muted-foreground">T{index + 2}</span></div>)}</div></CardContent></Card><div className="grid gap-3"><Card className="rounded-lg"><CardHeader><CardTitle className="text-base">12h 40m</CardTitle><CardDescription>Focus time</CardDescription></CardHeader></Card><Card className="rounded-lg"><CardHeader><CardTitle className="text-base">84%</CardTitle><CardDescription>On-time rate</CardDescription></CardHeader></Card><Card className="rounded-lg"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><BellRingIcon />AI insight</CardTitle><CardDescription>Bạn hoàn thành task khó tốt nhất trong khung 20:00 - 22:00. Hãy đặt một deep work sprint vào tối thứ Ba.</CardDescription></CardHeader></Card></div></section></DemoShell>
}

function CollaborationDemo() {
  const [tasks, setTasks] = React.useState(teamTasks)
  const [commentAdded, setCommentAdded] = React.useState(false)
  const completed = tasks.filter((task) => task.done).length
  return <DemoShell><section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><Card className="rounded-lg"><CardHeader><CardTitle>PRM393 Final Project</CardTitle><CardDescription>4 members · Deadline 22 Aug</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><div className="flex items-center justify-between text-sm"><span>Team progress</span><span>{completed}/{tasks.length} tasks</span></div><Progress value={(completed / tasks.length) * 100} />{tasks.map((task) => <button type="button" key={task.id} onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-left hover:bg-accent"><span className="flex items-center gap-3">{task.done ? <CheckCircle2Icon className="text-primary" /> : <CircleIcon className="text-muted-foreground" />}<span><span className="block text-sm font-medium">{task.title}</span><span className="text-xs text-muted-foreground">Assigned to {task.owner}</span></span></span><Badge variant={task.done ? "secondary" : "outline"}>{task.done ? "Done" : "In progress"}</Badge></button>)}</CardContent></Card><Card className="rounded-lg"><CardHeader><CardTitle className="flex items-center gap-2"><UsersRoundIcon />Team activity</CardTitle><CardDescription>Các hoạt động được cập nhật trong workspace.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex gap-3 text-sm"><UserPlusIcon className="mt-0.5 shrink-0 text-primary" /><span><strong>Minh</strong> đã nhận task “Thiết kế slide demo”.</span></div><div className="flex gap-3 text-sm"><MessageSquareIcon className="mt-0.5 shrink-0 text-primary" /><span><strong>An</strong>: “Mình đã cập nhật phần research rồi nhé.”</span></div>{commentAdded && <div className="flex gap-3 text-sm"><MessageSquareIcon className="mt-0.5 shrink-0 text-primary" /><span><strong>Bạn</strong>: “Mình sẽ review slide trước 20:00.”</span></div>}</CardContent><CardFooter><Button variant="outline" onClick={() => setCommentAdded(true)} disabled={commentAdded}><MessageSquareIcon data-icon="inline-start" />{commentAdded ? "Đã thêm comment" : "Thêm comment mẫu"}</Button></CardFooter></Card></section></DemoShell>
}

function AccountabilityDemo() {
  const [level, setLevel] = React.useState("standard")
  const [missed, setMissed] = React.useState(false)
  const [recovered, setRecovered] = React.useState(false)
  const score = missed && !recovered ? 66 : recovered ? 74 : 82
  const consequence = level === "strong" ? "Hoàn thành recovery review trước khi tạo focus sprint mới" : "Hoàn thành recovery review trước khi tạo plan mới"

  return <DemoShell><section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><Card className="rounded-lg"><CardHeader><CardTitle>Commitment contract</CardTitle><CardDescription>Ôn chương 1 EXE101 trước 21:30 hôm nay.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><Tabs value={level} onValueChange={(value) => value && setLevel(value)}><TabsList><TabsTrigger value="light">Light</TabsTrigger><TabsTrigger value="standard">Standard</TabsTrigger><TabsTrigger value="strong">Strong</TabsTrigger></TabsList></Tabs><div className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Evidence</p><p className="mt-1 font-medium">Quiz 80%+</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Grace period</p><p className="mt-1 font-medium">30 minutes</p></div></div><div className="rounded-lg border p-3"><p className="text-sm font-medium">Nếu missed task</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{consequence}. Người dùng có thể khai báo blocker hợp lệ để chuyển sang re-plan thay vì chịu hậu quả.</p></div></CardContent></Card><Card className="rounded-lg"><CardHeader><CardTitle>Accountability snapshot</CardTitle><CardDescription>Điểm được giải thích bằng hành vi, không dựa vào một lần thất bại.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-2"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Commitment</p><p className="mt-1 text-xl font-semibold">{score}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">On-time</p><p className="mt-1 text-xl font-semibold">3/4</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Honest check-in</p><p className="mt-1 text-xl font-semibold">100%</p></div></div><Progress value={score} />{missed && !recovered ? <div className="rounded-lg border p-4"><p className="text-sm font-medium">Recovery check-in required</p><p className="mt-1 text-sm text-muted-foreground">Task đã quá grace period. Ghi nhận lý do, thu nhỏ scope hoặc chọn một thời điểm bù trước khi tiếp tục.</p><Button className="mt-3" onClick={() => setRecovered(true)}><CheckIcon data-icon="inline-start" />Hoàn tất recovery review</Button></div> : <div className="rounded-lg border p-4"><p className="text-sm font-medium">{recovered ? "Recovery plan đã sẵn sàng" : "Commitment đang on track"}</p><p className="mt-1 text-sm text-muted-foreground">{recovered ? "Task được chuyển sang sprint 20 phút ngày mai. Reliability được cập nhật theo check-in trung thực." : "Bạn có thể thay đổi deadline trước grace period mà không bị tính missed."}</p></div>}</CardContent><CardFooter><Button variant={missed ? "outline" : "destructive"} onClick={() => { setMissed((value) => !value); setRecovered(false) }}>{missed ? "Khôi phục trạng thái demo" : "Mô phỏng missed task"}</Button></CardFooter></Card></section></DemoShell>
}

export default function RoadmapFeaturePage() {
  const params = useParams<{ featureId: string }>()
  const featureId = Array.isArray(params.featureId) ? params.featureId[0] : params.featureId
  switch (featureId) {
    case "ai-planning": return <AiPlanningDemo />
    case "focus-guard": return <FocusGuardDemo />
    case "template-marketplace": return <MarketplaceDemo />
    case "insights": return <InsightsDemo />
    case "collaboration": return <CollaborationDemo />
    case "accountability": return <AccountabilityDemo />
    default: return <DemoShell><Card className="rounded-lg"><CardHeader><CardTitle>Demo không tồn tại</CardTitle></CardHeader></Card></DemoShell>
  }
}
