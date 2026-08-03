import { existsSync, readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import type { prisma as prismaClient } from "../../../packages/db/src/client.ts"

type DemoUserInput = {
  id?: string
  email?: string
  joinDate: string
  displayName?: string
}

type DemoInput = {
  users: DemoUserInput[]
}

type DemoTask = {
  title: string
  minutes: number
  done: boolean
  guidance: string
}

type DemoPlan = {
  title: string
  description: string
  completion: string
  tasks: DemoTask[]
}

const args = new Set(process.argv.slice(2))
const apply = args.has("--apply")
const inputArg = process.argv.find((arg) => arg.startsWith("--input="))
const inputPath = inputArg
  ? path.resolve(inputArg.slice("--input=".length))
  : path.resolve("apps/api/prisma/submission-demo-users.json")
let prisma: typeof prismaClient

const demoPlans: DemoPlan[] = [
  {
    title: "[Submission Demo] Finish EXE201 Outcome 3 pitch deck",
    description:
      "Prepare the final Outcome 3 deck with execution evidence, customer validation, metrics, finance, and iteration insights.",
    completion:
      "A 12-slide English pitch deck is ready for final submission review.",
    tasks: [
      {
        title: "Collect CAP execution screenshots",
        minutes: 25,
        done: true,
        guidance:
          "Gather only evidence that proves real execution: posts, app screens, extension screens, and demo activity.",
      },
      {
        title: "Summarize metrics and actual results",
        minutes: 30,
        done: true,
        guidance:
          "Use dashboard or app records as the source. Avoid unsupported self-reported numbers.",
      },
      {
        title: "Write customer validation slide",
        minutes: 30,
        done: false,
        guidance:
          "Group feedback into patterns instead of listing every response one by one.",
      },
      {
        title: "Review deck against rubric",
        minutes: 20,
        done: false,
        guidance:
          "Check that OC1, OC2, and OC3 tell one consistent startup story.",
      },
    ],
  },
  {
    title: "[Submission Demo] Test LockIn focus sprint flow",
    description:
      "Run the product path from plan creation to focus session, extension sync, and post-sprint review.",
    completion:
      "The core LockIn demo flow has test evidence and screenshots.",
    tasks: [
      {
        title: "Create an AI-assisted plan",
        minutes: 20,
        done: true,
        guidance:
          "Use a realistic student task so the generated steps look credible in screenshots.",
      },
      {
        title: "Start a focus session from the plan",
        minutes: 25,
        done: true,
        guidance:
          "Capture the timer, active step, and session state before ending the sprint.",
      },
      {
        title: "Verify Chrome extension popup and HUD",
        minutes: 20,
        done: true,
        guidance:
          "Show that the extension mirrors the web app session and displays current tasks.",
      },
      {
        title: "Record QA notes",
        minutes: 15,
        done: false,
        guidance:
          "Write one note for what worked, what confused users, and what to improve next.",
      },
    ],
  },
]

function safeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

async function loadInput(): Promise<DemoInput> {
  const raw = await readFile(inputPath, "utf8")
  const parsed = JSON.parse(raw) as DemoInput

  if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
    throw new Error("Input must include at least one user.")
  }

  return parsed
}

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "")

    process.env[key] ??= value
  }
}

function buildSessionTimes(joinDate: Date, userIndex: number, planIndex: number) {
  const base = new Date(joinDate)
  base.setUTCDate(base.getUTCDate() + 2 + userIndex + planIndex * 3)
  base.setUTCHours(9 + planIndex * 2, 15, 0, 0)

  const plannedDuration = planIndex === 0 ? 45 * 60 : 60 * 60
  const duration = planIndex === 0 ? 38 * 60 : 64 * 60
  const endedAt = new Date(base.getTime() + duration * 1000)

  return {
    startedAt: base,
    endedAt,
    plannedDuration,
    duration,
    overtimeDuration: Math.max(0, duration - plannedDuration),
  }
}

async function findUser(input: DemoUserInput) {
  if (input.id) {
    return prisma.user.findUnique({ where: { id: input.id } })
  }

  if (input.email) {
    return prisma.user.findFirst({ where: { email: input.email } })
  }

  throw new Error("Each demo user needs either id or email.")
}

async function seedUser(input: DemoUserInput, userIndex: number) {
  const joinDate = new Date(input.joinDate)
  if (Number.isNaN(joinDate.getTime())) {
    throw new Error(`Invalid joinDate for ${input.email ?? input.id}`)
  }

  if (!apply) {
    console.log(
      `DRY ${input.email ?? input.id}: join=${joinDate.toISOString()}, plans=${demoPlans.length}`
    )
    return
  }

  const user = await findUser(input)

  if (!user) {
    console.log(`SKIP missing user: ${input.email ?? input.id}`)
    return
  }

  const userKey = safeId(user.email ?? user.id)
  const planIds = demoPlans.map((_, planIndex) =>
    `submission-demo-plan-${userKey}-${planIndex + 1}`
  )

  console.log(
    `APPLY ${user.email ?? user.id}: join=${joinDate.toISOString()}, plans=${demoPlans.length}`
  )

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        createdAt: joinDate,
        ...(input.displayName ? { firstName: input.displayName } : {}),
      },
    })

    await tx.userSettings.upsert({
      where: { userId: user.id },
      update: {
        blocklistHard: ["youtube.com", "facebook.com", "tiktok.com"],
        blocklistSoft: ["linkedin.com", "news.ycombinator.com"],
        defaultDuration: 25,
        tabGuard: true,
      },
      create: {
        userId: user.id,
        blocklistHard: ["youtube.com", "facebook.com", "tiktok.com"],
        blocklistSoft: ["linkedin.com", "news.ycombinator.com"],
        defaultDuration: 25,
        tabGuard: true,
      },
    })

    await tx.focusSession.deleteMany({
      where: { userId: user.id, planId: { in: planIds } },
    })

    for (const [planIndex, planSeed] of demoPlans.entries()) {
      const planId = planIds[planIndex]!
      const totalEstimatedMinutes = planSeed.tasks.reduce(
        (sum, task) => sum + task.minutes,
        0
      )

      await tx.plan.upsert({
        where: { id: planId },
        update: {
          name: planSeed.title,
          description: planSeed.description,
          completion: planSeed.completion,
          status: "ACTIVE",
          source: "AI",
          aiMode: "ASSISTED",
          totalEstimatedMinutes,
          deletedAt: null,
        },
        create: {
          id: planId,
          userId: user.id,
          name: planSeed.title,
          description: planSeed.description,
          completion: planSeed.completion,
          status: "ACTIVE",
          source: "AI",
          aiMode: "ASSISTED",
          totalEstimatedMinutes,
        },
      })

      await tx.planStep.deleteMany({ where: { planId } })

      await tx.planStep.createMany({
        data: planSeed.tasks.map((task, order) => ({
          id: `submission-demo-step-${userKey}-${planIndex + 1}-${order + 1}`,
          userId: user.id,
          planId,
          title: task.title,
          description: null,
          status: task.done ? "DONE" : "TODO",
          estimatedMinutes: task.minutes,
          order,
          guidance: task.guidance,
        })),
      })

      const times = buildSessionTimes(joinDate, userIndex, planIndex)
      await tx.focusSession.create({
        data: {
          id: `submission-demo-session-${userKey}-${planIndex + 1}`,
          userId: user.id,
          planId,
          startedAt: times.startedAt,
          endedAt: times.endedAt,
          duration: times.duration,
          plannedDuration: times.plannedDuration,
          overtimeDuration: times.overtimeDuration,
          completionType: times.overtimeDuration > 0 ? "OVERTIME" : "NORMAL",
          slipCount: planIndex === 0 ? 1 : 2,
          tasksSnapshot: planSeed.tasks.map((task) => ({
            label: task.title,
            done: task.done,
            durationMinutes: task.minutes,
          })),
          createdAt: times.startedAt,
        },
      })
    }
  })
}

async function main() {
  loadEnvFile(path.resolve("apps/api/.env"))
  loadEnvFile(path.resolve(".env"))
  ;({ prisma } = await import("../../../packages/db/src/client.ts"))

  const input = await loadInput()

  console.log(`Input: ${inputPath}`)
  console.log(`Mode: ${apply ? "apply" : "dry-run"}`)

  for (const [index, user] of input.users.entries()) {
    await seedUser(user, index)
  }

  if (!apply) {
    console.log("Dry-run only. Re-run with --apply to write demo records.")
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
