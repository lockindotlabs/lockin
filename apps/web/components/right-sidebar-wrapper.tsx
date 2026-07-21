"use client"

import { useRightSidebarContext } from "@/components/right-sidebar-context"
import { Sidebar, SidebarRail } from "@workspace/ui/components/sidebar"

export function RightSidebarWrapper() {
  const { hasContent, setContainer, width } = useRightSidebarContext()

  if (!hasContent) return null

  return (
    <Sidebar variant="inset" side="right" width={width}>
      <SidebarRail />
      <div ref={setContainer} className="flex h-full w-full flex-col" />
    </Sidebar>
  )
}
