import PlanEditor from "../PlanEditor"

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return <PlanEditor planId={id} />
}
