"use client"

import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    badge?: string
    isActive?: boolean
  }[]
}) {
  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <Link href={item.url}>
            <SidebarMenuButton isActive={item.isActive}>
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </Link>
          {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
        </SidebarMenuItem>
      ))}
    </>
  )
}
