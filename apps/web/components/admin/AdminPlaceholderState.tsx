import Link from "next/link"
import { ArrowLeftIcon, type LucideIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"

export function AdminPlaceholderState({
  icon: Icon,
  title,
  description,
  actionHref = "/app/admin/analytics",
  actionLabel = "Back to analytics",
}: {
  icon: LucideIcon
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="px-4 pb-10 sm:px-6 lg:px-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={actionHref} />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            {actionLabel}
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
