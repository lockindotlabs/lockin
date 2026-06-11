import type { ChatSummary } from "@/lib/chat/local-chat-persistence"
import type { PlanSummary } from "@/lib/plans/plan-repository"

export type AppSearchType = "all" | "chats" | "plans"

export type AppSearchResponse = {
  chats: ChatSummary[]
  plans: PlanSummary[]
}

type SearchAppOptions = {
  query: string
  type?: AppSearchType
  limit?: number
  signal?: AbortSignal
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function searchApp({
  query,
  type = "all",
  limit,
  signal,
}: SearchAppOptions) {
  const params = new URLSearchParams()
  params.set("q", query)
  params.set("type", type)

  if (limit !== undefined) {
    params.set("limit", String(limit))
  }

  return parseResponse<AppSearchResponse>(
    await fetch(`/api/search?${params.toString()}`, { signal })
  )
}
