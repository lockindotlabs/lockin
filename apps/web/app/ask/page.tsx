import { redirect } from "next/navigation"

type AskPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AskPage({ searchParams }: AskPageProps) {
  const params = new URLSearchParams()

  Object.entries(await searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
      return
    }

    if (value !== undefined) {
      params.set(key, value)
    }
  })

  redirect(`/app/ask${params.size > 0 ? `?${params.toString()}` : ""}`)
}
