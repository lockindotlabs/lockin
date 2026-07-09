"use client"

import { Settings2Icon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminPlaceholderState } from "@/components/admin/AdminPlaceholderState"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

export default function AdminSettingsPage() {
  return (
    <>
      <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
        <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
          <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
        </div>
        <main className="flex flex-col bg-background text-foreground">
          <AdminPageHeader
            icon={Settings2Icon}
            title="Settings"
            description="Configure admin defaults, operational controls, and future workspace policies."
          />
          <AdminPlaceholderState
            icon={Settings2Icon}
            title="Admin settings are coming soon."
            description="This area will hold global controls and internal configuration for the admin workspace."
          />
        </main>
      </ScrollArea>
    </>
  )
}
