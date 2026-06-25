"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckIcon,
  XIcon,
  Loader2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { Badge } from "@workspace/ui/components/badge"
import { BillingDialog } from "@/components/billing-dialog"
import { useAiUsageSummary } from "@/lib/ai/use-ai-usage-summary"
import { useBillingState } from "@/lib/billing/use-billing-state"
import { toast } from "sonner"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

type Interval = "monthly" | "yearly"

interface PricingCardProps {
  name: string
  price: string
  subtext?: string
  billingSubtext?: string
  buttonText: string
  isCurrent: boolean
  isPopular?: boolean
  features: { text: string; included: boolean }[]
  onUpgrade: () => void
  isLoading: boolean
  isDisabled: boolean
}

function PricingCard({
  name,
  price,
  subtext,
  billingSubtext = "/mo",
  buttonText,
  isCurrent,
  isPopular = false,
  features,
  onUpgrade,
  isLoading,
  isDisabled,
}: PricingCardProps) {
  return (
    <motion.div className="relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors duration-200 select-none">
      <div className="mb-5 flex flex-col">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-foreground">{name}</h3>
          {isPopular && (
            <Badge className="border-none bg-gradient-to-r from-amber-500 to-orange-500 py-0.5 text-white">
              Popular
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-medium tracking-tight text-foreground tabular-nums">
            {price}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {billingSubtext}
          </span>
        </div>
        {subtext ? (
          <p className="mt-1.5 h-4 text-xs text-muted-foreground">{subtext}</p>
        ) : (
          <div className="mt-1.5 h-4" /> // Spacing placeholder
        )}
      </div>

      <Button
        className={`w-full font-medium transition-colors duration-200 ${
          isCurrent
            ? "cursor-default border-border bg-muted/50 text-muted-foreground hover:bg-muted/50"
            : isPopular
              ? "bg-foreground text-background shadow-sm hover:bg-foreground/90"
              : "border border-border bg-background text-foreground hover:bg-accent"
        }`}
        disabled={isCurrent || isDisabled || isLoading}
        onClick={onUpgrade}
        variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Connecting...
          </>
        ) : isCurrent ? (
          <>
            <CheckIcon className="mr-1.5 size-4" />
            Current plan
          </>
        ) : (
          buttonText
        )}
      </Button>

      <hr className="my-5 border-border" />

      <ul className="flex-1 space-y-3 text-sm">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {feature.included ? (
              <CheckIcon className="mt-0.5 size-4 shrink-0" />
            ) : (
              <XIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground/40 line-through" />
            )}
            <span
              className={`leading-normal ${
                feature.included
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50 line-through"
              }`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

export default function SubscriptionPage() {
  const router = useRouter()
  const { summary, isLoaded: isSummaryLoaded } = useAiUsageSummary()
  const { billing, isBillingLoaded } = useBillingState()

  const [interval, setInterval] = React.useState<Interval>("monthly")
  const [billingOpen, setBillingOpen] = React.useState(false)
  const [checkoutTier, setCheckoutTier] = React.useState<string | null>(null)
  const [checkoutPlanName, setCheckoutPlanName] = React.useState<string | null>(
    null
  )

  const activeTier = billing?.tier ?? "FREE"

  const creditsUsed = summary?.credits.used ?? 0
  const creditsLimit = summary?.credits.limit ?? 10000
  const percentUsed = summary?.credits.percentUsed ?? 0

  const handleUpgrade = async (tier: "PLUS" | "PRO", planName: string) => {
    setCheckoutTier(tier)
    setCheckoutPlanName(planName)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      if (!response.ok) {
        throw new Error(`Checkout failed with status ${response.status}`)
      }

      const data = (await response.json()) as { checkoutUrl?: string }

      if (!data.checkoutUrl) {
        throw new Error("Checkout URL missing")
      }

      toast.success(`Redirecting to checkout for ${planName}...`)
      window.location.assign(data.checkoutUrl)
    } catch (error) {
      console.error(error)
      toast.error("Could not start checkout. Please try again.")
      setCheckoutTier(null)
      setCheckoutPlanName(null)
    }
  }

  // LockIn Subscription Plans
  const creativePlans = React.useMemo(() => {
    const isYearly = interval === "yearly"
    return [
      {
        name: "Free",
        price: "0₫",
        billingSubtext: "/mo",
        isCurrent: activeTier === "FREE",
        onUpgrade: () => {},
        features: [
          { text: "2 credits/day with Pro AI models", included: true },
          { text: "3 plans with AI Planner", included: true },
          { text: "3 projects", included: true },
          { text: "Basic LockIn Mode interface", included: true },
          {
            text: "Limited uploads (images, documents, recordings)",
            included: true,
          },
        ],
      },
      {
        name: "Plus",
        price: isYearly ? "65,800₫" : "79,000₫",
        billingSubtext: isYearly ? "/mo, billed 790,000₫/yr" : "/mo",
        isCurrent: activeTier === "PLUS",
        isPopular: true,
        onUpgrade: () => handleUpgrade("PLUS", "Plus"),
        features: [
          { text: "100 credits/month with Pro AI model", included: true },
          { text: "Unlimited plans with AI Planner", included: true },
          { text: "50 projects", included: true },
          { text: "Early access to new features", included: true },
          { text: "Customize and personalize their interface", included: true },
          { text: "Statistics view", included: true },
          { text: "Harder blockings for LockIn Mode", included: true },
          {
            text: "More uploads (images, documents, recordings)",
            included: true,
          },
          { text: "Bonus rewards", included: true },
          { text: "+ Everything in Free", included: true },
        ],
      },
      {
        name: "Pro",
        price: isYearly ? "157,500₫" : "189,000₫",
        billingSubtext: isYearly ? "/mo, billed 1,890,000₫/yr" : "/mo",
        isCurrent: activeTier === "PRO",
        onUpgrade: () => handleUpgrade("PRO", "Pro"),
        features: [
          { text: "300 credits/month with Pro AI model", included: true },
          { text: "Unlimited plans with AI Planner", included: true },
          { text: "Unlimited projects", included: true },
          {
            text: "Unlimited uploads (images, documents, recordings)",
            included: true,
          },
          { text: "More bonus rewards", included: true },
          { text: "+ Everything in Plus", included: true },
        ],
      },
    ]
  }, [interval, activeTier])

  const activeTierLabel = React.useMemo(() => {
    if (activeTier === "FREE") return "Free plan"
    if (activeTier === "PLUS") return "Plus plan"
    if (activeTier === "PRO") return "Pro plan"
    return "Free plan"
  }, [activeTier])

  return (
    <>
      <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
        <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
          <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
        </div>
        <section className="mx-auto w-full max-w-6xl px-4 lg:py-0">
          {/* Page Title */}
          <div className="mb-5 flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-medium tracking-tight">
                Subscription
              </h1>
            </div>
          </div>

          {/* Usage and Plan Status Row */}
          <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Credits Used Card */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 select-none">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  Credits used
                </span>
                <span className="font-medium text-foreground">
                  {isSummaryLoaded ? (
                    `${creditsUsed.toLocaleString()} credits / ${creditsLimit.toLocaleString()} credits`
                  ) : (
                    <span className="inline-block h-4 w-32 animate-pulse rounded bg-muted" />
                  )}
                </span>
              </div>
              <div className="mt-3">
                <Progress value={percentUsed} className="bg-muted" />
              </div>
            </div>

            {/* Current Plan Status Card */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-xs select-none">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Your plan
                </span>
                <span className="text-base font-medium text-foreground">
                  {isBillingLoaded ? (
                    `You're currently on ${activeTierLabel}`
                  ) : (
                    <span className="inline-block h-5 w-40 animate-pulse rounded bg-muted" />
                  )}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setBillingOpen(true)}
                className="gap-2 border-border font-medium hover:bg-accent"
              >
                <Settings className="size-4" />
                <span>Billing</span>
              </Button>
            </div>
          </div>

          {/* Filter Bar: Interval Toggle, Contact Support, Arrow Nav */}
          <div className="mb-8 flex flex-col gap-4 select-none sm:flex-row sm:items-center sm:justify-between">
            {/* Interval Toggle Switch */}
            <div className="flex w-fit items-center gap-1 rounded-xl border border-border/55 bg-muted/60 p-1">
              <button
                onClick={() => setInterval("monthly")}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                  interval === "monthly"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval("yearly")}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                  interval === "yearly"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly (save 2 months)
              </button>
            </div>

            {/* Extra Buttons */}
            <div className="flex items-center gap-3">
              {/* Navigation arrows (decorative/mock for sliders) */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg border-border hover:bg-accent disabled:opacity-40"
                  disabled
                >
                  <ChevronLeft className="size-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg border-border hover:bg-accent disabled:opacity-40"
                  disabled
                >
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={interval}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {creativePlans.map((plan, index) => {
                  const isCurrent = plan.isCurrent
                  const isFree = plan.name === "Free"
                  const isLoading = checkoutTier !== null
                  const isThisLoading = checkoutPlanName === plan.name

                  // Map specific buttons
                  let btnText = "Upgrade"
                  if (isFree) {
                    btnText = "Current plan"
                  } else if (
                    activeTier !== "FREE" &&
                    ((activeTier === "PRO" && plan.name === "Plus") ||
                      (activeTier === "PLUS" && plan.name === "Pro"))
                  ) {
                    // Downgrade case or upgrade case
                    btnText = activeTier === "PRO" ? "Downgrade" : "Upgrade"
                  }

                  return (
                    <PricingCard
                      key={plan.name}
                      name={plan.name}
                      price={plan.price}
                      subtext={(plan as any).subtext}
                      billingSubtext={plan.billingSubtext}
                      buttonText={btnText}
                      isCurrent={isCurrent}
                      isPopular={(plan as any).isPopular}
                      features={plan.features}
                      onUpgrade={plan.onUpgrade}
                      isLoading={!!isThisLoading}
                      isDisabled={isLoading && !isThisLoading}
                    />
                  )
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </ScrollArea>

      {/* Billing Dialog */}
      <BillingDialog open={billingOpen} onOpenChange={setBillingOpen} />
    </>
  )
}
