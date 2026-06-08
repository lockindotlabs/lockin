import { Suspense } from "react"

import { BillingResultPage } from "../BillingResultPage"

export default function BillingCancelPage() {
  return (
    <Suspense fallback={null}>
      <BillingResultPage mode="cancel" />
    </Suspense>
  )
}
