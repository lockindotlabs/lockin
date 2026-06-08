import { Suspense } from "react"

import { BillingResultPage } from "../BillingResultPage"

export default function BillingReturnPage() {
  return (
    <Suspense fallback={null}>
      <BillingResultPage mode="return" />
    </Suspense>
  )
}
