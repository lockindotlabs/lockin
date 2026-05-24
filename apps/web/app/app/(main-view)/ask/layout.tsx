import type { PropsWithChildren } from "react"
import { Suspense } from "react"

import { AskLayoutClient } from "./ask-layout-client"

export default function AskLayout({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={children}>
      <AskLayoutClient>{children}</AskLayoutClient>
    </Suspense>
  )
}
