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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { useClerk, UserAvatar, useUser } from "@clerk/nextjs"
import { BillingDialog } from "./billing-dialog"
import React from "react"
import { useBillingState } from "@/lib/billing/use-billing-state"
import { UpgradeDialog } from "./upgrade-dialog"
import { AI_CATALOG } from "@/lib/ai/catalog"
import { Atom01, Coins01, Coins04 } from "@untitledui/icons"

function CreditCoinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="160"
        cy="160"
        r="150"
        fill="url(#goldGradient)"
        stroke="#EAB308"
        strokeWidth="6"
      />
      <circle cx="160" cy="160" r="130" fill="url(#goldInnerGradient)" />

      <g transform="translate(50, 50) scale(0.6)">
        <path
          d="M279.437 220.444L183.457 316.409L107.35 240.334L102.807 235.782L50 182.978L163.557 69.4078L183.457 49.5273L203.348 69.4078L211.096 77.1742L223.239 89.3069L202.187 110.349L183.457 91.6201L165.87 109.197L92.0857 182.978L183.457 274.335L258.394 199.393L279.437 220.444Z"
          fill="white"
        />
        <path
          d="M316.901 182.976L295.868 204.018L256.086 164.239L277.138 143.188L316.901 182.976Z"
          fill="white"
        />
      </g>

      <defs>
        <linearGradient
          id="goldGradient"
          x1="0"
          y1="0"
          x2="320"
          y2="320"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient
          id="goldInnerGradient"
          x1="0"
          y1="0"
          x2="320"
          y2="320"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const { openUserProfile, signOut } = useClerk()
  const [billingOpen, setBillingOpen] = React.useState(false)
  const [upgradeOpen, setUpgradeOpen] = React.useState(false)

  const { billing } = useBillingState()

  const userTier = React.useMemo(() => {
    if (!billing) {
      return "Loading..."
    }
    return billing.tier !== "FREE" ? billing.tier : "Free Tier"
  }, [billing])

  const displayTier = React.useMemo(() => {
    if (!billing) return "Trial"
    if (billing.tier === "FREE") return "Trial"
    if (billing.tier === "PLUS") return "Plus"
    if (billing.tier === "PRO") return "Pro"
    return "Trial"
  }, [billing])
  const monthlyCredits = React.useMemo(() => {
    const tier = billing?.tier ?? "FREE"
    if (tier === "FREE") return 2000
    return AI_CATALOG[tier].creditsPerMonth
  }, [billing])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button>
              <UserAvatar />
            </button>
          }
        />
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "top"}
          align="end"
          sideOffset={12}
        >
          <DropdownMenuGroup>
            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
              <UserAvatar />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">name</span>
                <span className="truncate text-xs">name</span>
              </div>
            </div>

            <div className="mx-1 my-1 flex flex-col gap-1 rounded-md border bg-background p-2 text-sm select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Atom01 className="size-4 text-blue-500" strokeWidth={2} />
                  <span>{displayTier}</span>
                  <span className="text-xs leading-5 text-muted-foreground">
                    Valid untill Jan 12
                  </span>
                </div>
              </div>
              {/* Divider */}
              <div className="my-1 border-t" />

              {/* Row 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Coins04 className="size-4" />
                  <span>Credits</span>
                </div>
                <span className="text-xs leading-5 text-muted-foreground">
                  {monthlyCredits.toLocaleString()} monthly
                </span>
              </div>
            </div>
            <DropdownMenuItem onClick={() => setUpgradeOpen(true)}>
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
