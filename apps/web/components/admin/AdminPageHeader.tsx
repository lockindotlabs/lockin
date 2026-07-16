"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export function AdminPageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: LucideIcon
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Icon
            className="size-5 shrink-0 text-primary"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
  )
}
