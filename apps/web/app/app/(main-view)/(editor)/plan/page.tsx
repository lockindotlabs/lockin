import { redirect } from "next/navigation"
import PlanEditor from "./PlanEditor"
import posthog from "posthog-js"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{
    id?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { id } = await searchParams

  if (!id) {
    const newPlanId = crypto.randomUUID()
    posthog.capture("plan_created", { id: newPlanId })
    redirect(`/app/plan?id=${newPlanId}`)
  }

  return <PlanEditor planId={id} />
}
