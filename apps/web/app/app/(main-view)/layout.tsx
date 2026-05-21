import { AppSidebar } from "@/components/app-sidebar"
import { FeedbackPopover } from "@/components/feedback-popover"
import { RightAiSidebar } from "@/components/right-ai-sidebar"
import RightAiSidebarProvider from "@/components/right-ai-sidebar-provider"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <RightAiSidebarProvider>
          {children}
          <div className="absolute right-5 bottom-5 z-10">
            <FeedbackPopover />
          </div>
        </RightAiSidebarProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
