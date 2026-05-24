import { redirect } from "next/navigation"
import PlanEditor from "./PlanEditor"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{
    id?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { id } = await searchParams

  if (!id) {
    redirect(`/app/plan?id=${crypto.randomUUID()}`)
  }

  return <PlanEditor planId={id} />
}
