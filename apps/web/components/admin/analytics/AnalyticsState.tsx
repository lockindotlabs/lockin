import { AlertTriangleIcon, BarChart3Icon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function AnalyticsLoadingState() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-8">
      <p className="text-sm text-muted-foreground">Loading analytics...</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Skeleton className="h-96" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

export function AnalyticsEmptyState() {
  return (
    <div className="px-4 pb-10 sm:px-6 lg:px-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No analytics data yet.</EmptyTitle>
          <EmptyDescription>
            Once users start creating plans and completing Sprints, activity
            will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}

export function AnalyticsErrorState() {
  return (
    <div className="px-4 pb-10 sm:px-6 lg:px-8">
      <Alert variant="destructive">
        <AlertTriangleIcon aria-hidden="true" />
        <AlertTitle>Could not load analytics.</AlertTitle>
        <AlertDescription>Try refreshing the page.</AlertDescription>
      </Alert>
    </div>
  )
}
