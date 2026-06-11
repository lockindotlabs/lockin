"use client"

export const DEFAULT_ASK_THREAD_ID = "369e818703498069a67900a96860af54"
export const DEFAULT_ONBOARDING_PLAN_ID = "d42ab54f86414faf9d40e330f9c3019b"

type BuildAskHrefOptions = {
  chatSessionId?: string
  planId?: string
  currentSearchParams?: URLSearchParams | ReadonlyURLSearchParams
}

type ReadonlyURLSearchParams = Pick<URLSearchParams, "forEach">

export function buildAskHref({
  chatSessionId,
  planId,
  currentSearchParams,
}: BuildAskHrefOptions = {}) {
  const currentParams = new URLSearchParams()

  currentSearchParams?.forEach((value, key) => {
    currentParams.set(key, value)
  })

  const params = new URLSearchParams()
  const nextChatSessionId =
    chatSessionId ?? currentParams.get("id") ?? currentParams.get("t")
  const nextPlanId = planId ?? currentParams.get("p")

  if (nextChatSessionId) {
    params.set("id", nextChatSessionId)
    params.set("chatSessionId", nextChatSessionId)
  }

  if (nextPlanId) {
    params.set("p", nextPlanId)
  }

  const queryString = params.toString()

  return queryString ? `/app/ask?${queryString}` : "/app/ask"
}
