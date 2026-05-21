import { AlertCircleIcon, Loader2Icon } from "lucide-react"

export const LoadingState = () => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <Loader2Icon className="size-4 animate-spin" />
    <span className="text-sm">Loading</span>
  </div>
)

export const DegradedState = () => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <AlertCircleIcon className="size-4" />
    <span className="text-sm">
      Clerk is experiencing issues. Please try again later.
    </span>
  </div>
)

export const FailedState = () => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <AlertCircleIcon className="size-4" />
    <span className="text-sm">
      Something went wrong. Please refresh the page and try again.
    </span>
  </div>
)
