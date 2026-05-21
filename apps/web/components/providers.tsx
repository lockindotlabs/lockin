"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

const clerkAppearance = {
  variables: {
    colorPrimary: "#1D1D16",
    colorPrimaryForeground: "#FFFFFF",
    colorBackground: "#FFFFFF",
    colorForeground: "#0C0C09",
    colorNeutral: "#0C0C09",
    colorInput: "#FFFFFF",
    colorInputForeground: "#0C0C09",
    colorMuted: "#F4F4F0",
    colorMutedForeground: "#7C7C67",
    colorSuccess: "#22C543",
    colorWarning: "#F36B16",
    colorDanger: "#E7000B",
    colorRing: "#ABAB9D",
    colorShadow: "#0000001A",
    colorModalBackdrop: "#C4C4C4",
    borderRadius: "0.5rem",
    spacing: "0.8rem",
  },
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/app">
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </ClerkProvider>
  )
}