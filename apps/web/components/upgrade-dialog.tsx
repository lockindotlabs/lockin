"use client"

import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Progress } from "@workspace/ui/components/progress"
import { CheckIcon, HelpCircleIcon } from "lucide-react"
import type { BillingTier, PaidBillingTier } from "@/lib/billing/catalog"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { useBillingState } from "@/lib/billing/use-billing-state"

type UpgradePlan = {
  tier: BillingTier
  name: string
  price: string
  description: string
  billing: string | null
  ctaVariant: "outline" | "default"
  badge: string | null
  includes: string
  features: string[]
}

const upgradePlans: UpgradePlan[] = [
  {
    tier: "FREE",
    name: "Free",
    price: "0₫",
    description: "/month",
    billing: null,
    ctaVariant: "outline",
    badge: null,
    includes: "Includes",
    features: [
      "2 credits/day with Pro AI models",
      "3 plans with AI Planner",
      "3 projects",
      "Basic LockIn Mode interface",
      "Limited uploads (images, documents, recordings)",
    ],
  },
  {
    tier: "PLUS",
    name: "Plus",
    price: "79,000₫",
    description: "/month",
    billing: "monthly",
    ctaVariant: "default",
    badge: null,
    includes: "Everything in Free, plus:",
    features: [
      "100 credits/month with Pro AI model",
      "Unlimited plans with AI Planner",
      "50 projects",
      "Early access to new features",
      "Customize and personalize their interface",
      "Statistics view",
      "Harder blockings for LockIn Mode",
      "More uploads (images, documents, recordings)",
      "Bonus rewards",
    ],
  },
  {
    tier: "PRO",
    name: "Pro",
    price: "189,000₫",
    description: "/month",
    billing: "monthly",
    ctaVariant: "default",
    badge: null,
    includes: "Everything in Plus, plus:",
    features: [
      "300 credits/month with Pro AI model",
      "Unlimited plans with AI Planner",
      "Unlimited projects",
      "Unlimited uploads (images, documents, recordings)",
      "More bonus rewards",
    ],
  },
]

function PlanFeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-foreground" />
          <span className="min-w-0">{feature}</span>
        </li>
      ))}
    </ul>
  )
}

export function UpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { billing } = useBillingState()
  const [billingError, setBillingError] = React.useState<string | null>(null)
  const [checkoutTier, setCheckoutTier] =
    React.useState<PaidBillingTier | null>(null)

  const handleUpgradeClick = async (tier: BillingTier) => {
    if (tier === "FREE") {
      return
    }

    setBillingError(null)
    setCheckoutTier(tier)

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null

        throw new Error(
          data?.error ?? `Checkout failed with status ${response.status}`
        )
      }

      const data = (await response.json()) as { checkoutUrl?: string }

      if (!data.checkoutUrl) {
        throw new Error("Checkout URL missing")
      }

      window.location.assign(data.checkoutUrl)
    } catch (error) {
      setBillingError(
        error instanceof Error
          ? error.message
          : "Could not start checkout. Please try again."
      )
      setCheckoutTier(null)
    }
  }

  const currentTier = billing?.tier ?? "FREE"
  const activeTierLabel =
    upgradePlans.find((plan) => plan.tier === currentTier)?.name ?? "Free"
  const expiryLabel = billing?.planExpiresAt
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(new Date(billing.planExpiresAt))
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block h-[calc(90vh)] overflow-hidden sm:max-w-6xl sm:min-w-5xl">
        <DialogHeader>
          <DialogTitle className={"sr-only"}>Explore plans</DialogTitle>
        </DialogHeader>
        <div>
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              Your current plan
            </h3>
            <div className="flex flex-row gap-2">
              <div className="flex flex-1 flex-col gap-6 rounded-xl border border-border bg-background p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h4 className="font-medium">{activeTierLabel}</h4>
                  <p className="text-muted-foreground">
                    For organizing your plans, focus sessions, and AI-assisted
                    work.
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <span>
                      {expiryLabel
                        ? `Active until ${expiryLabel}`
                        : "Free access"}
                    </span>
                    <HelpCircleIcon className="size-4" />
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-6 rounded-xl border border-border bg-background p-6 lg:flex-row lg:items-center lg:justify-between">
                <Field className="w-full max-w-sm">
                  <FieldLabel htmlFor="credits-remaining">
                    <span className="text-base">Credits remaining</span>
                    <span className="ml-auto">12</span>
                  </FieldLabel>
                  <Progress value={66} id="credits-remaining" />
                </Field>
                <Button variant="outline">Top up</Button>
              </div>
            </div>
          </section>

          <section className="mt-12 space-y-6">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              Compare all plans
              <HelpCircleIcon className="size-4 text-muted-foreground" />
            </h3>

            <div className="flex flex-col gap-6 px-2">
              {billingError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {billingError}
                </div>
              ) : null}
              <div className="grid lg:grid-cols-3">
                {upgradePlans.map((plan) => {
                  const isCurrent = plan.tier === currentTier
                  const isCheckingOut = checkoutTier === plan.tier

                  return (
                    <div key={plan.name} className="space-y-4 px-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xl font-medium">{plan.name}</h4>
                          {plan.badge ? (
                            <Badge
                              variant={
                                plan.badge === "Popular"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                plan.badge === "Popular"
                                  ? "bg-primary/15 text-primary-foreground"
                                  : "text-muted-foreground"
                              }
                            >
                              {plan.badge}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="text-foreground">{plan.price}</span>{" "}
                          {plan.description}
                        </p>
                      </div>
                      <Button
                        variant={plan.ctaVariant}
                        onClick={() => handleUpgradeClick(plan.tier)}
                        disabled={isCurrent || isCheckingOut}
                      >
                        {isCurrent
                          ? "Current Plan"
                          : isCheckingOut
                            ? "Opening checkout..."
                            : "Upgrade"}
                      </Button>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-md bg-muted px-5 py-4">
                <div className="grid gap-8 lg:grid-cols-3">
                  {upgradePlans.map((plan) => (
                    <div key={plan.name} className="min-w-0">
                      <h5 className="mb-2 text-sm font-semibold">
                        {plan.includes}
                      </h5>
                      <PlanFeatureList features={plan.features} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
