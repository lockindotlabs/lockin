import { Suspense } from "react"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { assertAdminPageAccess } from "@/lib/server/admin-access"
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
  await assertAdminPageAccess()

  return (
    <HeaderPortalProvider>
      <RightSidebarPortalProvider>
        <SidebarProvider>
          <Suspense fallback={null}>
            <AdminSidebar />
          </Suspense>
          <SidebarInset className="overflow-hidden">
            <GlobalHeader />
            {children}
          </SidebarInset>
          <RightSidebarWrapper />
        </SidebarProvider>
      </RightSidebarPortalProvider>
    </HeaderPortalProvider>
  )
}
