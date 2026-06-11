import "dotenv/config"

import prisma from "@workspace/db"

const DEFAULT_WINDOW_MINUTES = 10

type PlanRow = {
  id: string
  userId: string
  name: string
  createdAt: Date
  updatedAt: Date
  source: "MANUAL" | "AI"
  aiMode: "MANUAL" | "ASSISTED"
  _count: {
    steps: number
    focusSessions: number
  }
}

type DuplicateCandidate = {
  candidate: PlanRow
  canonical: PlanRow
  distanceMinutes: number
}

function hasFlag(name: string) {
  return process.argv.includes(name)
}

function getNumberArg(name: string, fallback: number) {
  const prefix = `${name}=`
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
  const value = raw ? Number(raw) : NaN

  return Number.isFinite(value) && value > 0 ? value : fallback
}

function normalizedName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

function isEmptyPlan(plan: PlanRow) {
  return plan._count.steps === 0 && plan._count.focusSessions === 0
}

function isCanonicalPlan(plan: PlanRow) {
  return plan._count.steps > 0 || plan._count.focusSessions > 0
}

function minutesBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / 60_000
}

function isDatabaseConnectionError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : null

  return (
    code === "ECONNREFUSED" ||
    code === "EACCES" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT"
  )
}

function findDuplicateCandidates(plans: PlanRow[], windowMinutes: number) {
  const byUserAndName = new Map<string, PlanRow[]>()

  for (const plan of plans) {
    const key = `${plan.userId}\u0000${normalizedName(plan.name)}`
    const current = byUserAndName.get(key) ?? []
    current.push(plan)
    byUserAndName.set(key, current)
  }

  const candidates: DuplicateCandidate[] = []

  for (const group of byUserAndName.values()) {
    if (group.length < 2) {
      continue
    }

    const canonicalPlans = group.filter(isCanonicalPlan)

    if (canonicalPlans.length === 0) {
      continue
    }

    for (const candidate of group.filter(isEmptyPlan)) {
      const nearestCanonical = canonicalPlans
        .filter((plan) => plan.id !== candidate.id)
        .map((plan) => ({
          canonical: plan,
          distanceMinutes: minutesBetween(candidate.createdAt, plan.createdAt),
        }))
        .sort((a, b) => a.distanceMinutes - b.distanceMinutes)[0]

      if (!nearestCanonical || nearestCanonical.distanceMinutes > windowMinutes) {
        continue
      }

      candidates.push({
        candidate,
        canonical: nearestCanonical.canonical,
        distanceMinutes: nearestCanonical.distanceMinutes,
      })
    }
  }

  return candidates
}

async function main() {
  const apply = hasFlag("--apply")
  const windowMinutes = getNumberArg("--window-minutes", DEFAULT_WINDOW_MINUTES)

  const plans = await prisma.plan.findMany({
    where: { deletedAt: null },
    orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      userId: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      source: true,
      aiMode: true,
      _count: {
        select: {
          steps: true,
          focusSessions: true,
        },
      },
    },
  })

  const candidates = findDuplicateCandidates(plans, windowMinutes)

  console.log(
    `Duplicate plan cleanup ${apply ? "APPLY" : "DRY RUN"}: ${candidates.length} candidate(s)`
  )
  console.log(`Window: ${windowMinutes} minute(s)`)

  for (const { candidate, canonical, distanceMinutes } of candidates) {
    console.log(
      [
        `candidate=${candidate.id}`,
        `canonical=${canonical.id}`,
        `user=${candidate.userId}`,
        `title=${JSON.stringify(candidate.name)}`,
        `distance=${distanceMinutes.toFixed(2)}m`,
        `candidateCreated=${candidate.createdAt.toISOString()}`,
        `canonicalSteps=${canonical._count.steps}`,
        `canonicalSessions=${canonical._count.focusSessions}`,
      ].join(" ")
    )
  }

  if (!apply || candidates.length === 0) {
    await prisma.$disconnect()
    return
  }

  const ids = candidates.map(({ candidate }) => candidate.id)
  const result = await prisma.plan.updateMany({
    where: {
      id: { in: ids },
      deletedAt: null,
      steps: { none: {} },
      focusSessions: { none: {} },
    },
    data: { deletedAt: new Date() },
  })

  console.log(`Soft-deleted ${result.count} duplicate candidate(s).`)
  await prisma.$disconnect()
}

main().catch(async (error) => {
  if (isDatabaseConnectionError(error)) {
    console.error(
      "Could not connect to the configured database. Start the local database or point DATABASE_URL at a reachable instance, then rerun the dry-run."
    )
  }

  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
