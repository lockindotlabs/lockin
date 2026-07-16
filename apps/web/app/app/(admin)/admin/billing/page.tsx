"use client"

import { CreditCardIcon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "@/components/admin/analytics/AnalyticsState"
import { SubscriptionSection } from "@/components/admin/analytics/SubscriptionSection"
import { TransactionHistoryTable } from "@/components/admin/analytics/TransactionHistoryTable"
import { useAdminData } from "@/lib/admin/use-admin-data"
import type { AdminBillingData } from "@/types/admin-analytics"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

export default function AdminBillingPage() {
  const { data, error, isLoading } = useAdminData<AdminBillingData>(
    "/api/admin/billing"
  )
  const hasData =
    (data?.subscriptionMetrics.length ?? 0) > 0 ||
    (data?.planDistributionData.length ?? 0) > 0

  return (
    <>
      <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
        <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
          <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
        </div>
        <main className="flex flex-col bg-background text-foreground">
          <AdminPageHeader
            icon={CreditCardIcon}
            title="Billing"
            description="Track subscription mix and payment-state health."
          />

          {isLoading ? <AnalyticsLoadingState /> : null}
          {!isLoading && error ? <AnalyticsErrorState /> : null}
          {!isLoading && !error && !hasData ? <AnalyticsEmptyState /> : null}

          {!isLoading && !error && data && hasData ? (
            <div className="px-4 pb-10 sm:px-6 lg:px-8 flex flex-col gap-8">
              <SubscriptionSection
                metrics={data.subscriptionMetrics}
                planDistributionData={data.planDistributionData}
              />
              <TransactionHistoryTable transactions={data.recentTransactions} />
            </div>
          ) : null}
        </main>
      </ScrollArea>
    </>
  )
}
