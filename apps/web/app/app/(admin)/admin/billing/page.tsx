"use client"

import { CreditCardIcon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "@/components/admin/analytics/AnalyticsState"
import { SubscriptionSection } from "@/components/admin/analytics/SubscriptionSection"
import { useAdminData } from "@/lib/admin/use-admin-data"
import type { AdminBillingData } from "@/types/admin-analytics"

export default function AdminBillingPage() {
  const { data, error, isLoading } = useAdminData<AdminBillingData>(
    "/api/admin/billing"
  )
  const hasData =
    (data?.subscriptionMetrics.length ?? 0) > 0 ||
    (data?.planDistributionData.length ?? 0) > 0

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <AdminPageHeader
        icon={CreditCardIcon}
        title="Billing"
        description="Track subscription mix and payment-state health."
      />

      {isLoading ? <AnalyticsLoadingState /> : null}
      {!isLoading && error ? <AnalyticsErrorState /> : null}
      {!isLoading && !error && !hasData ? <AnalyticsEmptyState /> : null}

      {!isLoading && !error && data && hasData ? (
        <div className="px-4 pb-10 sm:px-6 lg:px-8">
          <SubscriptionSection
            metrics={data.subscriptionMetrics}
            planDistributionData={data.planDistributionData}
          />
        </div>
      ) : null}
    </main>
  )
}
