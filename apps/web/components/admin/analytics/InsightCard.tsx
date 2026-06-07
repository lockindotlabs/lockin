import { AlertCircleIcon } from "lucide-react"
import type { ReactNode } from "react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

export function InsightCard({
  title = "Insight",
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <Alert>
      <AlertCircleIcon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
