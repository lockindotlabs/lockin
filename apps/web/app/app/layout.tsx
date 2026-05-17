"use client"

import { Geist_Mono, Inter } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs"
import { FeedbackPopover } from "@/components/feedback-popover"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const metadata = {
  title: "LockIn",
  description:
    "A tool to help you stay focused and avoid distractions while working on your projects.",
}

const clerkProviderAppearance = {
  theme: "shadcn",
  variables: {
    // Brand & Primary Colors
    colorPrimary: "#1D1D16",
    colorPrimaryForeground: "#FFFFFF",

    // Layout & Backgrounds
    colorBackground: "#FFFFFF",
    colorForeground: "#0C0C09",
    colorNeutral: "#0C0C09",

    // Component Specifics
    colorInput: "#FFFFFF",
    colorInputForeground: "#0C0C09",
    colorMuted: "#F4F4F0",
    colorMutedForeground: "#7C7C67",

    // Feedback States
    colorSuccess: "#22C543",
    colorWarning: "#F36B16",
    colorDanger: "#E7000B",

    // Decorative
    colorRing: "#ABAB9D",
    colorShadow: "#0000001A",
    colorModalBackdrop: "#C4C4C4",

    borderRadius: "0.5rem",
    spacing: "0.8rem",

    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 600,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body>
        <ClerkProvider
          appearance={clerkProviderAppearance}
          afterSignOutUrl={"/app"}
        >
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
