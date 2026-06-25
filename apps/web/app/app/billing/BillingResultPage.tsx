"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import Image from "next/image"

type BillingState = {
  tier: "FREE" | "PLUS" | "PRO"
  planExpiresAt: string | null
  latestOrder: {
    status: string
    tier: "FREE" | "PLUS" | "PRO"
    payosOrderCode: number
  } | null
}

type BillingResultPageProps = {
  mode: "return" | "cancel"
}

function formatDate(value: string | null) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function BillingResultPage({ mode }: BillingResultPageProps) {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get("orderCode")
  const [billing, setBilling] = React.useState<BillingState | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function loadBilling() {
      try {
        if (orderCode) {
          const syncResponse = await fetch("/api/billing/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderCode }),
          })

          if (syncResponse.ok) {
            const data = (await syncResponse.json()) as BillingState

            if (!cancelled) {
              setBilling(data)
            }

            return
          }
        }

        const response = await fetch("/api/billing/me", { cache: "no-store" })

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as BillingState

        if (!cancelled) {
          setBilling(data)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBilling()

    return () => {
      cancelled = true
    }
  }, [orderCode])

  const isPaid =
    billing?.latestOrder?.status === "PAID" || billing?.tier !== "FREE"
  const title =
    mode === "cancel"
      ? "Payment cancelled"
      : isPaid
        ? "Payment confirmed"
        : "Payment pending"
  const description =
    mode === "cancel"
      ? "No plan changes were made. You can restart checkout whenever you are ready."
      : isPaid
        ? `Your ${billing?.tier.toLowerCase()} access is active until ${formatDate(billing?.planExpiresAt ?? null) ?? "the end of this billing period"}.`
        : "We are waiting for payOS to send the verified payment result. This page may show pending for a short moment after bank transfer."
  const Icon =
    mode === "cancel" ? XCircleIcon : isPaid ? CheckCircle2Icon : ClockIcon

  return (
    <main className="mx-auto flex h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
      <div className="flex w-full flex-col items-center space-y-6 rounded-2xl border bg-background p-6">
        <div className="flex flex-col items-center gap-3">
          <Icon className="size-12 text-primary" strokeWidth={1.5} />
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-medium tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="w-full rounded-lg bg-muted px-4 py-3 text-center font-mono text-sm font-medium text-muted-foreground">
          {isLoading ? (
            <span>Checking billing status...</span>
          ) : (
            <span>
              Current plan: <span>{billing?.tier ?? "FREE"}</span>
              {orderCode ? ` · Order ${orderCode}` : ""}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/app">
            <Button>Back to app</Button>
          </Link>

          <Link href="/app/subscription">
            <Button variant="outline">View plans</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
