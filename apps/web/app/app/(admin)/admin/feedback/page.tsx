"use client"

import { MessageSquareTextIcon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { FeedbackPageClient } from "@/components/admin/feedback/FeedbackPageClient"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

export default function AdminFeedbackPage() {
  return (
    <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
      <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
        <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
      </div>
      <main className="flex flex-col bg-background text-foreground">
        <AdminPageHeader
          icon={MessageSquareTextIcon}
          title="Feedback"
          description="Review feedback submitted from the app and track what has been handled."
        />
        <FeedbackPageClient />
      </main>
    </ScrollArea>
  )
}
