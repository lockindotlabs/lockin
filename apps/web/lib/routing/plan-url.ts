"use client"

type BuildPlanHrefOptions = {
  planId?: string
  currentSearchParams?: URLSearchParams | ReadonlyURLSearchParams
}

type ReadonlyURLSearchParams = Pick<URLSearchParams, "get">

export function buildPlanHref({
  planId,
  currentSearchParams,
}: BuildPlanHrefOptions = {}) {
  const nextPlanId = planId ?? currentSearchParams?.get("id")

  if (!nextPlanId) {
    return "/app/plan"
  }

  const params = new URLSearchParams()
  params.set("id", nextPlanId)

  return `/app/plan?${params.toString()}`
}
