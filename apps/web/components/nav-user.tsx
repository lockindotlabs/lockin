import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  SparkleIcon,
  Sparkles,
  UserIcon,
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
import { Progress } from "@workspace/ui/components/progress"
import { useClerk, useUser } from "@clerk/nextjs"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()

  return (
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
                  <span className="truncate font-medium">{user?.fullName}</span>
                  <span className="truncate text-xs">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          ></DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              {/* Credits card (informational) */}
              <DropdownMenuItem className="">
                <div className="w-full">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium">Credits</span>
                  </div>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-medium tracking-tight">
                      7,250
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / 10,000
                    </span>
                  </div>

                  <Progress value={72} className="mt-3 w-full" />

                  <div className="mt-3 text-xs text-muted-foreground">
                    Refills in 11 days
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparkleIcon />
                Upgrade
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => openUserProfile()}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
