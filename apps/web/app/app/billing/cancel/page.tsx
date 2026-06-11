import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"

import { BillingResultPage } from "../BillingResultPage"

export default async function BillingCancelPage() {
  await auth.protect()

  return (
    <Suspense fallback={null}>
      <BillingResultPage mode="cancel" />
    </Suspense>
  )
}
