import { auth } from "@clerk/nextjs/server"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import GlobalHeader from "@/components/global-header"
import { HeaderPortalProvider } from "@/components/header-context"
import { RightSidebarPortalProvider } from "@/components/right-sidebar-context"
import { RightSidebarWrapper } from "@/components/right-sidebar-wrapper"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await auth.protect()

  return (
    <HeaderPortalProvider>
      <RightSidebarPortalProvider>
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset className="min-h-svh overflow-hidden">
            <GlobalHeader />
            <div className="min-h-0 flex-1 overflow-auto">{children}</div>
          </SidebarInset>
          <RightSidebarWrapper />
        </SidebarProvider>
      </RightSidebarPortalProvider>
    </HeaderPortalProvider>
  )
}
