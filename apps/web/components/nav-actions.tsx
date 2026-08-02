"use client"

import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  LinkIcon,
  Trash2Icon,
  StarIcon,
  MoreHorizontalIcon,
} from "lucide-react"

type NavActionsProps = {
  copyUrl?: string
  onDelete?: () => void | Promise<void>
}

function getAbsoluteUrl(url: string) {
  if (typeof window === "undefined") {
    return url
  }

  return new URL(url, window.location.origin).toString()
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "-9999px"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  textarea.remove()
}

export function NavActions({ copyUrl, onDelete }: NavActionsProps = {}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [didCopy, setDidCopy] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    if (!didCopy) {
      return
    }

    const timeoutId = window.setTimeout(() => setDidCopy(false), 1600)

    return () => window.clearTimeout(timeoutId)
  }, [didCopy])

  const handleCopyLink = async () => {
    const href =
      typeof window === "undefined"
        ? (copyUrl ?? "")
        : getAbsoluteUrl(copyUrl ?? window.location.href)

    if (!href) {
      return
    }

    try {
      await copyText(href)
      setDidCopy(true)
    } catch {
      window.alert("Could not copy the link. Try again in a moment.")
    }
  }

  const handleDelete = async () => {
    if (!onDelete) {
      return
    }

    setIsDeleting(true)

    try {
      await onDelete()
      setIsOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
        <StarIcon />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 data-open:bg-accent"
            />
          }
        >
          <MoreHorizontalIcon />
        </PopoverTrigger>
        <PopoverContent
          className="w-56 overflow-hidden rounded-lg p-0"
          align="end"
        >
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent className="gap-0">
              <SidebarGroup className="border-b p-1 last:border-none">
                <SidebarGroupContent className="gap-0">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleCopyLink}>
                        <LinkIcon />
                        <span>{didCopy ? "Copied Link" : "Copy Link"}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className="text-destructive hover:text-destructive"
                        disabled={!onDelete || isDeleting}
                        onClick={handleDelete}
                      >
                        <Trash2Icon />
                        <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
    </div>
  )
}
