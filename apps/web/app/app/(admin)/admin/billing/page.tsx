"use client"

import { CreditCardIcon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminPlaceholderState } from "@/components/admin/AdminPlaceholderState"
import { analyticsMockData } from "@/lib/mock/admin-analytics"
import { SubscriptionSection } from "@/components/admin/analytics/SubscriptionSection"

export default function AdminBillingPage() {
  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <AdminPageHeader
        icon={CreditCardIcon}
        title="Billing & Quotas"
        description="Track subscription changes, quota pressure, and revenue-side account health."
      />
      <div className="px-4 pb-10 sm:px-6 lg:px-8">
        <SubscriptionSection
          metrics={analyticsMockData.subscriptionMetrics}
          planDistributionData={analyticsMockData.planDistributionData}
        />
      </div>
    </main>
  )
}
