"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentProps } from "react"

import { NavUser } from "@/components/nav-user"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import { cn } from "@workspace/ui/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import {
  adminNavItems,
  isAdminNavItemActive,
} from "./admin-nav"
import { Badge } from "@workspace/ui/components/badge"

// function AdminNavSection({
//   section,
//   pathname,
// }: {
//   section: AdminNavSectionType
//   pathname: string
// }) {
//   return (
//     <SidebarGroup>
//       <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
//       <SidebarGroupContent>
//         <SidebarMenu>
//           {section.items.map((item) => (
//             <SidebarMenuItem key={item.title}>
//               <SidebarMenuButton
//                 isActive={isAdminNavItemActive(item, pathname)}
//                 render={<Link href={item.url} />}
//               >
//                 <item.icon />
//                 <span>{item.title}</span>
//               </SidebarMenuButton>
//             </SidebarMenuItem>
//           ))}
//         </SidebarMenu>
//       </SidebarGroupContent>
//     </SidebarGroup>
//   )
// }

export function AdminSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar
      className="border-r-0 font-medium"
      {...props}
      collapsible="offcanvas"
    >
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 pr-1">
          <Link
            href="/app/admin/overview"
            className="flex items-center"
            aria-label="Admin overview"
          >
            <LogoAccent className="h-8" />
            <Badge variant="secondary" className="ml-1">
              Admin
            </Badge>
          </Link>
          <SidebarTrigger
            className={cn(
              "transition-opacity",
              state === "collapsed" && "pointer-events-none opacity-0"
            )}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isAdminNavItemActive(item, pathname)}
                    render={<Link href={item.url} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
