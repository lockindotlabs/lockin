"use client"

import * as React from "react"
import Link from "next/link"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Separator } from "@workspace/ui/components/separator"
import { ArrowRightIcon, CheckIcon } from "lucide-react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { useBillingState } from "@/lib/billing/use-billing-state"
import type { BillingTier } from "@/lib/billing/catalog"

const basicFeatures = [
  "5 teams",
  "Admin roles",
  "Restrict agent invocation to workspace members",
  "Unlimited file upload size",
  "File upload deletion",
  "Unlimited issues",
  "Restrict new user invitations",
]

const planLabels: Record<BillingTier, string> = {
  FREE: "Free",
  PLUS: "Plus",
  PRO: "Pro",
}

function formatBillingDate(value: string | null) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value))
}

export function BillingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { billing, isBillingLoaded, reloadBilling } = useBillingState()
  const currentTier = billing?.tier ?? "FREE"
  const planLabel = planLabels[currentTier]
  const expiryLabel = formatBillingDate(billing?.planExpiresAt ?? null)
  const latestPaymentStatus = billing?.latestOrder?.status ?? null
  const nextUpgradeTier =
    currentTier === "FREE" ? "PLUS" : currentTier === "PLUS" ? "PRO" : null
  const nextUpgradeLabel = nextUpgradeTier ? planLabels[nextUpgradeTier] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block h-[calc(90vh)] overflow-hidden sm:max-w-6xl sm:min-w-5xl">
        <DialogHeader>
          <DialogTitle className={"sr-only"}>Billing</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full flex-col">
          <section className="mx-auto flex max-w-3xl flex-col gap-4">
            <h3 className="text-lg font-medium">Your current plan</h3>
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium">
                      {isBillingLoaded ? `${planLabel} plan` : "Loading plan"}
                    </h3>
                    <Badge variant="secondary">Current</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {!isBillingLoaded
                      ? "Checking your billing status..."
                      : expiryLabel && currentTier !== "FREE"
                        ? `Active until ${expiryLabel}`
                        : "Free for all users"}
                  </p>
                  {latestPaymentStatus ? (
                    <p className="text-sm text-muted-foreground">
                      Latest payment: {latestPaymentStatus.toLowerCase()}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-6 md:justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="secondary">Manage</Button>}
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          nativeButton={false}
                          render={<Link href="/app/subscription" />}
                        >
                          Switch plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void reloadBilling()}>
                          Refresh billing
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-medium">
                      {nextUpgradeLabel
                        ? `Upgrade to ${nextUpgradeLabel}`
                        : "You are on the highest plan"}
                    </h3>
                    <p className="text-muted-foreground">
                      {nextUpgradeTier === "PLUS" ? (
                        <>
                          <span className="text-foreground">79.000đ</span>
                          /month
                        </>
                      ) : nextUpgradeTier === "PRO" ? (
                        <>
                          <span className="text-foreground">189.000đ</span>
                          /month
                        </>
                      ) : (
                        "Your current plan includes every available billing feature."
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href="/app/subscription" />}
                    >
                      View all plans
                    </Button>
                    {nextUpgradeTier ? (
                      <Button
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/app/subscription" />}
                      >
                        Upgrade now
                      </Button>
                    ) : null}
                  </div>
                </div>

                <Separator />

                <ul className="grid gap-2 text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                  {basicFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex min-w-0 items-center gap-2"
                    >
                      <CheckIcon className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-6 flex max-w-3xl flex-col gap-5">
            <h3 className="text-lg font-medium">Recent invoices</h3>
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <p className="text-muted-foreground">No invoices yet</p>
            </div>
          </section>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
