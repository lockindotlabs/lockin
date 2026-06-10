import { Suspense } from "react"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { assertAdminPageAccess } from "@/lib/server/admin-access"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await assertAdminPageAccess()

  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AdminSidebar />
      </Suspense>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
