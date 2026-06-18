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
import { Atom01, Coins04 } from "@untitledui/icons"

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
    return AI_CATALOG[tier].creditsPerMonth
  }, [billing])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="size-8">
              <UserAvatar />
            </button>
          }
        />
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "top"}
          align="end"
          sideOffset={16}
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
                  <span className="text-xs">{displayTier}</span>
                  <span className="text-2xs leading-5 text-muted-foreground">
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
                  <span className="text-xs">Credits</span>
                </div>
                <span className="text-2xs leading-5 text-muted-foreground">
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
