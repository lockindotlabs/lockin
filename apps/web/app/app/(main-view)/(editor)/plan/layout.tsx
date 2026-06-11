import type { PropsWithChildren } from "react"
import { Suspense } from "react"

import { PlanAssistantLayoutClient } from "./plan-assistant-layout-client"

export default function PlanLayout({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={children}>
      <PlanAssistantLayoutClient>{children}</PlanAssistantLayoutClient>
    </Suspense>
  )
}
