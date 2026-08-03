"use client"

import Link from "next/link"
import {
  ArrowUpRightIcon,
  BotIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  GaugeIcon,
  GitBranchIcon,
  MegaphoneIcon,
  PlugIcon,
  RocketIcon,
  ServerCogIcon,
  SparklesIcon,
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
import {
  roadmapCheckpointPlans,
  roadmapFeatures,
  roadmapFoundationAreas,
  roadmapProductPhases,
  stageItems,
} from "./mock-data"

const foundationIcons = [
  GitBranchIcon,
  DatabaseIcon,
  BotIcon,
  ServerCogIcon,
  GaugeIcon,
  MegaphoneIcon,
  PlugIcon,
]

export default function RoadmapPage() {
  return (
    <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background text-foreground">
      <main className="mx-auto mt-12 flex w-full max-w-6xl flex-col gap-8 px-4 py-8 pb-16 lg:px-8">
        <section className="flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit">Future roadmap</Badge>
          <div className="flex max-w-3xl flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Roadmap phát triển LockIn</h1>
            <p className="text-sm leading-6 text-muted-foreground md:text-base">
              Khám phá các hướng phát triển tiếp theo. Mỗi tính năng có một prototype tương tác với mock data để mô phỏng trải nghiệm trước khi xây dựng thật.
            </p>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3" aria-label="Roadmap phases">
          {stageItems.map((stage) => (
            <Card key={stage.label} className="rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {stage.label === "Now" ? <RocketIcon /> : <SparklesIcon />}
                  {stage.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {stage.items.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roadmapFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.id} className="flex rounded-lg">
                <CardHeader className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground"><Icon /></span>
                    <Badge variant={feature.stage === "Now" ? "default" : "outline"}>{feature.stage}</Badge>
                  </div>
                  <CardTitle className="mt-4 text-base">{feature.title}</CardTitle>
                  <CardDescription className="leading-5">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Prototype readiness</span><span>{feature.progress}%</span></div>
                  <Progress value={feature.progress} />
                  <p className="text-sm text-muted-foreground">{feature.demoSummary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {feature.modules.slice(0, 3).map((module) => (
                      <Badge key={module.name} variant="secondary">{module.name}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button nativeButton={false} render={<Link href={`/app/roadmap/${feature.id}`} />} className="w-full">
                      Xem demo
                      <ArrowUpRightIcon data-icon="inline-end" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex max-w-3xl flex-col gap-2">
            <Badge variant="secondary" className="w-fit">Merged product roadmap</Badge>
            <h2 className="text-xl font-semibold tracking-tight">Lộ trình sản phẩm sau khi gộp với roadmap team</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Section này đưa roadmap về format theo phase: MVP, sau MVP, mở rộng ngách và B2B/B2C. Nội dung đã gộp
              các phần team bổ sung với cơ chế, AI, dữ liệu và accountability của app.
            </p>
          </div>
          <div className="grid gap-4">
            {roadmapProductPhases.map((phase) => (
              <Card key={phase.phase} className="rounded-lg">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-2">
                      <CardTitle className="text-base">{phase.phase}</CardTitle>
                      <CardDescription className="max-w-4xl leading-5">{phase.goal}</CardDescription>
                    </div>
                    <Badge variant={phase.stage === "Now" ? "default" : "outline"}>{phase.stage}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-3">
                  {phase.sections.map((section) => (
                    <div key={section.title} className="rounded-md border bg-muted/20 p-4">
                      <p className="mb-3 text-sm font-medium">{section.title}</p>
                      <div className="flex flex-col gap-2">
                        {section.bullets.map((item) => (
                          <div key={item} className="flex items-start gap-2 text-sm leading-5">
                            <CheckCircle2Icon className="mt-0.5 shrink-0 text-primary" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex max-w-3xl flex-col gap-2">
            <Badge variant="secondary" className="w-fit">Foundation roadmap</Badge>
            <h2 className="text-xl font-semibold tracking-tight">Cơ chế, hạ tầng và AI cần build</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Đây là lớp nền để các prototype phía trên trở thành sản phẩm thật: luật vận hành, dữ liệu sự kiện,
              AI có kiểm soát, runtime focus, đo lường và tích hợp nền tảng.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {roadmapFoundationAreas.map((area, index) => {
              const Icon = foundationIcons[index] ?? ServerCogIcon
              return (
                <Card key={area.title} className="rounded-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                          <Icon />
                        </span>
                        <div>
                          <CardTitle className="text-base">{area.title}</CardTitle>
                          <CardDescription className="mt-1">{area.stage} foundation</CardDescription>
                        </div>
                      </div>
                      <Badge variant={area.stage === "Now" ? "default" : "outline"}>{area.stage}</Badge>
                    </div>
                    <CardDescription className="leading-5">{area.purpose}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Architecture readiness</span>
                      <span>{area.readiness}%</span>
                    </div>
                    <Progress value={area.readiness} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Checkpoint</p>
                        {area.checkpoints.slice(0, 3).map((item) => (
                          <div key={item} className="flex items-start gap-2 text-sm">
                            <CheckCircle2Icon className="mt-0.5 shrink-0 text-primary" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Build order</p>
                        {area.buildOrder.map((item, order) => (
                          <div key={item} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{order + 1}</Badge>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border bg-muted/20 p-3">
                        <p className="mb-2 text-sm font-medium">Rủi ro</p>
                        <div className="flex flex-col gap-2">
                          {area.risks.slice(0, 2).map((item) => (
                            <p key={item} className="text-sm leading-5 text-muted-foreground">{item}</p>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-md border bg-muted/20 p-3">
                        <p className="mb-2 text-sm font-medium">Cách mở khóa</p>
                        <div className="flex flex-col gap-2">
                          {area.unlocks.slice(0, 2).map((item) => (
                            <p key={item} className="text-sm leading-5 text-muted-foreground">{item}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex max-w-3xl flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Checkpoint planning notes</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Mỗi checkpoint được note theo cùng một khung: bản chất tính năng, cách tiếp cận, hướng cải tiến,
              vướng mắc chính và cách tháo gỡ để prototype có chiều sâu hơn trước khi build thật.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {roadmapFeatures.map((feature) => {
              const checkpoint = roadmapCheckpointPlans[feature.id]
              return (
                <Card key={feature.id} className="rounded-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">{checkpoint.title}</CardTitle>
                      <Badge variant={feature.stage === "Now" ? "default" : "outline"}>{feature.stage}</Badge>
                    </div>
                    <CardDescription className="leading-5">{checkpoint.purpose}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Approach</p>
                      {checkpoint.approach.slice(0, 3).map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm">
                          <CheckCircle2Icon className="mt-0.5 shrink-0 text-primary" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Vướng mắc cần gỡ</p>
                      {checkpoint.blockers.slice(0, 2).map((item) => (
                        <div key={item} className="rounded-md border bg-muted/20 p-2 text-sm leading-5 text-muted-foreground">
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button nativeButton={false} render={<Link href={`/app/roadmap/${feature.id}`} />} variant="outline" className="w-full">
                      Mở checkpoint demo
                      <ArrowUpRightIcon data-icon="inline-end" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Nguyên tắc thử nghiệm</CardTitle>
              <CardDescription>Các prototype này chỉ dùng mock data và không ghi thay đổi vào dữ liệu tài khoản.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {["Luồng thao tác rõ ràng trước khi đầu tư backend", "Hiển thị trạng thái, phản hồi và dữ liệu gần thực tế", "Thu thập phản hồi theo từng phase"].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm"><CheckCircle2Icon className="mt-0.5 shrink-0 text-primary" />{item}</div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Bắt đầu từ phase Now</CardTitle>
              <CardDescription>Focus Guard là nền tảng gần với hành vi LockIn hiện tại nhất.</CardDescription>
            </CardHeader>
            <CardContent><Progress value={76} /></CardContent>
            <CardFooter>
              <Button nativeButton={false} render={<Link href="/app/roadmap/focus-guard" />} variant="outline">Mở Focus Guard demo<ArrowUpRightIcon data-icon="inline-end" /></Button>
            </CardFooter>
          </Card>
        </section>
      </main>
    </ScrollArea>
  )
}
