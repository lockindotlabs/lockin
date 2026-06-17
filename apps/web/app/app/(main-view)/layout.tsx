import { auth } from "@clerk/nextjs/server"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import GlobalHeader from "@/components/global-header"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await auth.protect()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
