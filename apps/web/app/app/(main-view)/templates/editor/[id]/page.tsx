import { notFound } from "next/navigation"

import { TemplateEditorForm } from "@/components/templates/editor/TemplateEditorForm"
import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { getOwnedTemplate } from "@/lib/server/template-authoring-store"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TemplateEditorPage({ params }: PageProps) {
  const user = await getCurrentDbUser()

  if (!user) {
    notFound()
  }

  const { id } = await params
  const template = await getOwnedTemplate(user.id, id)

  if (!template) {
    notFound()
  }

  return <TemplateEditorForm template={template} />
}
