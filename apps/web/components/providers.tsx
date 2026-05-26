"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

const clerkAppearance = {
  // variables: {
  //   colorPrimary: "var(--color-primary)",
  //   colorPrimaryForeground: "var(--color-primary-foreground)",
  //   colorBackground: "var(--color-background)",
  //   colorForeground: "var(--color-foreground)",
  //   colorNeutral: "var(--color-secondary-foreground)",
  //   colorInput: "var(--color-input)",
  //   colorMuted: "var(--color-muted)",
  //   colorMutedForeground: "var(--color-muted-foreground)",
  //   colorSuccess: "var(--color-success)",
  //   colorWarning: "var(--color-warning)",
  //   colorDanger: "var(--color-danger)",
  //   colorRing: "var(--color-ring)",
  //   colorModalBackdrop: "var(--color-modal-backdrop)",
  //   borderRadius: "0.5rem",
  // },
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
