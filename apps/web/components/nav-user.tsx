import {
  CircleArrowUpIcon,
  CreditCard,
  LifeBuoyIcon,
  LogOut,
  UserRoundIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useSidebar } from "@workspace/ui/components/sidebar"
import { useClerk, UserAvatar } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { BillingDialog } from "./billing-dialog"
import React from "react"
import { useAiUsageSummary } from "@/lib/ai/use-ai-usage-summary"
import { UpgradeDialog } from "./upgrade-dialog"
import { Button } from "@workspace/ui/components/button"
import { Infinity } from "@untitledui/icons"

export function NavUser({
  side = "bottom",
  align = "end",
  sideOffset = 16,
}: {
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  sideOffset?: number
}) {
  const { isMobile } = useSidebar()
  const { openUserProfile, signOut } = useClerk()
  const router = useRouter()
  const [billingOpen, setBillingOpen] = React.useState(false)
  const [upgradeOpen, setUpgradeOpen] = React.useState(false)

  const { summary } = useAiUsageSummary()

  const tierName = React.useMemo(() => {
    if (!summary) return "Free Tier"
    if (summary.tier === "FREE") return "Free Tier"
    return `${summary.tier.charAt(0) + summary.tier.slice(1).toLowerCase()} Tier`
  }, [summary])

  const aiPlansText = React.useMemo(() => {
    if (!summary) return "0 / 3"
    const { created, limit } = summary.aiPlans
    if (limit === null) return `${created} / Unlimited`
    return `${created} / ${limit}`
  }, [summary])

  const totalCredits = React.useMemo(() => {
    if (!summary) return 1000
    return summary.credits.limit
  }, [summary])

  const remainingCredits = React.useMemo(() => {
    if (!summary) return 867
    return summary.credits.remaining
  }, [summary])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="size-8 cursor-pointer outline-none">
              <UserAvatar />
            </button>
          }
        />
        <DropdownMenuContent
          className="w-64 rounded-xl p-1"
          side={isMobile ? "bottom" : side}
          align={isMobile ? "end" : align}
          sideOffset={sideOffset}
        >
          <DropdownMenuGroup>
            <div className="mb-1 flex flex-col rounded-lg border border-border bg-card p-3 select-none">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{tierName}</span>
                <Button
                  size={"xs"}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push("/app/subscription")
                  }}
                >
                  Upgrade
                </Button>
              </div>

              {/* Credits Info */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium text-foreground">
                    {totalCredits.toLocaleString()} credits
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium text-foreground">
                    {remainingCredits.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI Plans</span>
                  <span className="font-medium text-foreground">
                    {aiPlansText}
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenuItem onClick={() => router.push("/app/subscription")}>
              <CircleArrowUpIcon />
              Upgrade Plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openUserProfile()}>
              <UserRoundIcon />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBillingOpen(true)}>
              <CreditCard />
              Billing
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <LifeBuoyIcon />
              Support
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <BillingDialog open={billingOpen} onOpenChange={setBillingOpen} />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  )
}
