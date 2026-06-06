import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CircleArrowUpIcon,
  CreditCard,
  LifeBuoyIcon,
  LogOut,
  Settings2Icon,
  SparkleIcon,
  Sparkles,
  UserIcon,
  UserRoundIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { useClerk, useUser } from "@clerk/nextjs"
import { BillingDialog } from "./billing-dialog"
import React from "react"
import { useBillingState } from "@/lib/billing/use-billing-state"
import { UpgradeDialog } from "./upgrade-dialog"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
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

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="hover:bg-accent hover:text-accent-foreground data-pressed:bg-accent data-pressed:text-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={
                        user?.fullName || user?.emailAddresses[0]?.emailAddress
                      }
                    />
                    <AvatarFallback className="rounded-full">
                      <UserIcon />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.fullName}
                    </span>
                    <span className="truncate text-xs">{userTier}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              }
            ></DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "top"}
              align="end"
              sideOffset={12}
            >
              <DropdownMenuGroup>
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
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => signOut()}
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <BillingDialog open={billingOpen} onOpenChange={setBillingOpen} />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  )
}
