export function calculateRetroMinutes(stepMinutes: number[]) {
  const total = stepMinutes.reduce(
    (sum, minutes) => sum + (Number.isFinite(minutes) ? minutes : 0),
    0
  )

  return Math.max(10, Math.round(Math.max(total * 0.12, 10) / 5) * 5)
}
