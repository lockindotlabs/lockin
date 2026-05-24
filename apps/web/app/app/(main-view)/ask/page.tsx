import { Suspense } from "react"

import { AskPageClient } from "./ask-page-client"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AskPageClient />
    </Suspense>
  )
}
