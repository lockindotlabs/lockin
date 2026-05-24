import type { Metadata } from "next"
import {
  Inter,
  Geist_Mono,
  Funnel_Display,
  Archivo,
  Inter_Tight,
} from "next/font/google"
import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { cn } from "@workspace/ui/lib/utils"
import "@workspace/ui/styles/globals.css"

const inter = Inter({
  subsets: ["vietnamese"],
  variable: "--font-sans",
})

const interTight = Inter_Tight({
  subsets: ["vietnamese"],
  variable: "--font-sans-tight",
})

const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

const funnelDisplay = Funnel_Display({
  subsets: ["latin-ext"],
  variable: "--font-funnel",
  weight: ["600"],
})

export const metadata: Metadata = {
  title: "LockIn",
  description:
    "A tool to help you stay focused and avoid distractions while working on your projects.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        inter.variable,
        fontMono.variable,
        funnelDisplay.variable,
        interTight.variable
      )}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
