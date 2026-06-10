"use client"

import { Settings2Icon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminPlaceholderState } from "@/components/admin/AdminPlaceholderState"

export default function AdminSettingsPage() {
  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
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
  )
}
