import { TemplateReviewClient } from "@/components/admin/templates/TemplateReviewClient"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { ClipboardCheckIcon } from "lucide-react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

export default function AdminTemplatesPage() {
  return (
    <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
      <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
        <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
      </div>
      <main className="flex flex-col bg-background text-foreground">
        <AdminPageHeader
          icon={ClipboardCheckIcon}
          title="Template review"
          description="Duyet hoac tu choi template truoc khi no xuat hien cong khai trong marketplace."
        />
        <div className="px-4 pb-10 sm:px-6 lg:px-8">
          <TemplateReviewClient />
        </div>
      </main>
    </ScrollArea>
  )
}
