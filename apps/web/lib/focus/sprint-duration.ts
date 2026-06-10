// Pure helpers for reconciling "estimated time of selected steps" against
// "chosen sprint duration" in the Sprint Setup Modal.
//
// Kept separate from the modal component (and from focus-api.ts) so the
// mismatch logic can be unit-tested in isolation once a test runner is wired
// up for apps/web (currently `pnpm test` in apps/web is a no-op placeholder).

export type DurationPreset = { label: string; seconds: number }

export type MismatchDirection = "under" | "over" | "match"
export type MismatchLevel = "none" | "minor" | "moderate" | "major"

export type DurationMismatch = {
  /** chosenDuration - estimatedSeconds; negative = sprint shorter than estimate */
  diffSeconds: number
  /** |diffSeconds| / estimatedSeconds, 0 when there is no estimate to compare against */
  diffRatio: number
  level: MismatchLevel
  direction: MismatchDirection
}

// Thresholds are intentionally named constants (not magic numbers) so they can
// be tuned after observing real usage without hunting through the component.
export const MISMATCH_THRESHOLDS = {
  /** Below this ratio AND below minAbsSeconds, the difference is treated as noise */
  minorRatio: 0.2,
  /** At/above this ratio (and above minAbsSeconds) the mismatch is "major" */
  majorRatio: 0.5,
  /** Absolute floor — small plans (e.g. 20m vs 25m) shouldn't trigger banners */
  minAbsSeconds: 10 * 60,
} as const

/**
 * Compares the total estimated time of selected steps against the chosen
 * sprint duration and classifies how significant the gap is.
 *
 * Returns level "none" whenever there is nothing meaningful to compare
 * (no estimate available) or the gap is small enough to be noise.
 */
export function getDurationMismatch(
  estimatedSeconds: number,
  chosenDuration: number
): DurationMismatch {
  if (estimatedSeconds <= 0) {
    return { diffSeconds: 0, diffRatio: 0, level: "none", direction: "match" }
  }

  const diffSeconds = chosenDuration - estimatedSeconds
  const diffRatio = Math.abs(diffSeconds) / estimatedSeconds
  const direction: MismatchDirection =
    diffSeconds < 0 ? "under" : diffSeconds > 0 ? "over" : "match"

  const isNoise = Math.abs(diffSeconds) < MISMATCH_THRESHOLDS.minAbsSeconds
  let level: MismatchLevel = "none"
  if (!isNoise) {
    if (diffRatio >= MISMATCH_THRESHOLDS.majorRatio) level = "major"
    else if (diffRatio >= MISMATCH_THRESHOLDS.minorRatio) level = "moderate"
    else level = "minor"
  }

  return { diffSeconds, diffRatio, level, direction }
}

/** Longest preset in the list — used as the fallback for "at least" lookups. */
function longestPreset(presets: DurationPreset[]): DurationPreset | undefined {
  return presets.reduce<DurationPreset | undefined>(
    (max, p) => (!max || p.seconds > max.seconds ? p : max),
    undefined
  )
}

/** Shortest preset in the list — used as the fallback for "at most" lookups. */
function shortestPreset(presets: DurationPreset[]): DurationPreset | undefined {
  return presets.reduce<DurationPreset | undefined>(
    (min, p) => (!min || p.seconds < min.seconds ? p : min),
    undefined
  )
}

const FALLBACK_PRESET: DurationPreset = { label: "25m", seconds: 25 * 60 }

/**
 * Smallest preset that is >= target; falls back to the longest preset
 * available, or a hardcoded 25m default if `presets` is empty (defensive —
 * callers always pass the app's non-empty DURATION_PRESETS).
 */
export function nearestPresetAtLeast(
  presets: DurationPreset[],
  targetSeconds: number
): DurationPreset {
  return (
    presets.find((p) => p.seconds >= targetSeconds) ??
    longestPreset(presets) ??
    FALLBACK_PRESET
  )
}

/**
 * Largest preset that is <= target; falls back to the shortest preset
 * available, or a hardcoded 25m default if `presets` is empty.
 */
export function nearestPresetAtMost(
  presets: DurationPreset[],
  targetSeconds: number
): DurationPreset {
  return (
    [...presets].reverse().find((p) => p.seconds <= targetSeconds) ??
    shortestPreset(presets) ??
    FALLBACK_PRESET
  )
}
