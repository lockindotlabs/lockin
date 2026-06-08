"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  MoreHorizontalIcon,
  LinkIcon,
  ArrowUpRightIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"

export type FavoriteItem = {
  id: string
  name: string
  url: string
  emoji?: string
  isActive?: boolean
}

export function NavFavorites({
  favorites,
  label = "Favorites",
  emptyLabel,
  isLoading = false,
  onDelete,
}: {
  favorites: FavoriteItem[]
  label?: string
  emptyLabel?: string
  isLoading?: boolean
  onDelete?: (item: FavoriteItem) => void
}) {
  const { isMobile } = useSidebar()
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading && (
          <>
            {Array.from({ length: 3 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <Skeleton className="h-3 w-28 rounded-full" />
                </div>
              </SidebarMenuItem>
            ))}
          </>
        )}
        {!isLoading && favorites.length === 0 && emptyLabel && (
          <SidebarMenuItem>
            <div className="px-2 py-1 text-xs text-sidebar-foreground/60">
              {emptyLabel}
            </div>
          </SidebarMenuItem>
        )}
        {favorites.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              isActive={item.isActive}
              render={<Link href={item.url} title={item.name} />}
            >
              {item.emoji && <span>{item.emoji}</span>}
              <span>{item.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuAction
                    showOnHover
                    className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
                  />
                }
              >
                <MoreHorizontalIcon />
                <span className="sr-only">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <LinkIcon className="text-muted-foreground" />
                    <span>Copy Link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ArrowUpRightIcon className="text-muted-foreground" />
                    <span>Open in New Tab</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete?.(item)}
                  >
                    <Trash2Icon className="text-muted-foreground" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        {favorites.length > 10 && (
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontalIcon />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
