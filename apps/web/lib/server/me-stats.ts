import prisma from "@workspace/db"
import type { TaskSnapshot } from "@/lib/focus/focus-api"

export type SprintInsight = {
  id: string
  planName: string | null
  startedAt: string
  duration: number | null
  completionType: "EARLY" | "NORMAL" | "OVERTIME" | null
  doneCount: number
  totalSteps: number
  sprintOnTime: boolean
  procrastinationIndex: number
}

export type HeatmapCell = {
  date: string // yyyy-MM-dd, local to the server
  volume: number
  avgQuality: number // 0-1, see sprintQuality()
  onTimeCount: number
  lateCount: number
}

export type MeStatsResponse = {
  totalSprints: number
  totalFocusSeconds: number
  onTimeRate: number // 0-100
  averageProcrastinationIndex: number // 0-1
  completionTypeBreakdown: { name: string; value: number; key: string }[]
  sprints: SprintInsight[]
  heatmap: HeatmapCell[]
  maxHeatmapVolume: number
}

function parseSnapshot(value: unknown): TaskSnapshot[] {
  if (!Array.isArray(value)) return []
  return value as TaskSnapshot[]
}

// Same >2-extensions rule used live in the session page — kept in sync so
// historical data reads the same way it was scored at end-of-sprint time.
function sprintIsOnTime(snapshot: TaskSnapshot[]): boolean {
  return snapshot.every((t) => (t.extensionCount ?? 0) <= 2)
}

function averageProcrastination(snapshot: TaskSnapshot[]): number {
  if (snapshot.length === 0) return 0
  const sum = snapshot.reduce((acc, t) => acc + (t.procrastinationScore ?? 0), 0)
  return sum / snapshot.length
}

// On-time sprints land in [0.6, 1.0] (still docked a bit for mild
// procrastination); not-on-time sprints always stay low, in [0.0, 0.3].
function sprintQuality(sprintOnTime: boolean, procrastinationIndex: number): number {
  return sprintOnTime
    ? 1 - procrastinationIndex * 0.4
    : 0.3 - procrastinationIndex * 0.3
}

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// One cell per calendar day (GitHub contributions style) instead of the
// day-of-week × hour-of-day grid — easier to scan a year of activity at once.
function buildHeatmap(
  sprints: Array<Pick<SprintInsight, "startedAt" | "sprintOnTime" | "procrastinationIndex">>
): { heatmap: HeatmapCell[]; maxHeatmapVolume: number } {
  const buckets = new Map<
    string,
    { qualitySum: number; volume: number; onTimeCount: number; lateCount: number }
  >()

  for (const s of sprints) {
    const key = dateKey(new Date(s.startedAt))
    const quality = sprintQuality(s.sprintOnTime, s.procrastinationIndex)

    const existing = buckets.get(key)
    if (existing) {
      existing.qualitySum += quality
      existing.volume += 1
      if (s.sprintOnTime) existing.onTimeCount++
      else existing.lateCount++
    } else {
      buckets.set(key, {
        qualitySum: quality,
        volume: 1,
        onTimeCount: s.sprintOnTime ? 1 : 0,
        lateCount: s.sprintOnTime ? 0 : 1,
      })
    }
  }

  const heatmap: HeatmapCell[] = Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    volume: b.volume,
    avgQuality: b.qualitySum / b.volume,
    onTimeCount: b.onTimeCount,
    lateCount: b.lateCount,
  }))

  const maxHeatmapVolume = heatmap.reduce((max, c) => Math.max(max, c.volume), 0)
  return { heatmap, maxHeatmapVolume }
}

export async function getMeStats(userId: string): Promise<MeStatsResponse> {
  const sessions = await prisma.focusSession.findMany({
    where: { userId, endedAt: { not: null } },
    select: {
      id: true,
      startedAt: true,
      duration: true,
      completionType: true,
      tasksSnapshot: true,
      plan: { select: { name: true } },
    },
    orderBy: { startedAt: "desc" },
  })

  const sprints: SprintInsight[] = sessions.map((s) => {
    const snapshot = parseSnapshot(s.tasksSnapshot)
    const doneCount = snapshot.filter((t) => t.done).length
    return {
      id: s.id,
      planName: s.plan?.name ?? null,
      startedAt: s.startedAt.toISOString(),
      duration: s.duration,
      completionType: s.completionType,
      doneCount,
      totalSteps: snapshot.length,
      sprintOnTime: sprintIsOnTime(snapshot),
      procrastinationIndex: averageProcrastination(snapshot),
    }
  })

  const totalSprints = sprints.length
  const totalFocusSeconds = sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0)
  const onTimeCount = sprints.filter((s) => s.sprintOnTime).length
  const onTimeRate = totalSprints > 0 ? (onTimeCount / totalSprints) * 100 : 0
  const averageProcrastinationIndex =
    totalSprints > 0
      ? sprints.reduce((sum, s) => sum + s.procrastinationIndex, 0) / totalSprints
      : 0

  const breakdownCounts = { EARLY: 0, NORMAL: 0, OVERTIME: 0 }
  for (const s of sprints) {
    if (s.completionType) breakdownCounts[s.completionType]++
  }
  const completionTypeBreakdown = [
    { name: "On time", value: breakdownCounts.NORMAL, key: "normal" },
    { name: "Ended early", value: breakdownCounts.EARLY, key: "early" },
    { name: "Overtime", value: breakdownCounts.OVERTIME, key: "overtime" },
  ].filter((b) => b.value > 0)

  const { heatmap, maxHeatmapVolume } = buildHeatmap(sprints)

  return {
    totalSprints,
    totalFocusSeconds,
    onTimeRate,
    averageProcrastinationIndex,
    completionTypeBreakdown,
    sprints,
    heatmap,
    maxHeatmapVolume,
  }
}
