"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { useEffect } from "react"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"

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
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: "2026-01-30",
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/app">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </ClerkProvider>
    </PHProvider>
  )
}
