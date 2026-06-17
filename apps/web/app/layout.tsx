import type { Metadata } from "next"
import { cookies } from "next/headers"
import {
  Inter,
  Geist_Mono,
  Funnel_Display,
  Inter_Tight,
  IBM_Plex_Mono,
} from "next/font/google"
import "katex/dist/katex.min.css"
;("@workspace/ui/globals.css")
import { Providers } from "@/components/providers"
import { cn } from "@workspace/ui/lib/utils"
import "@workspace/ui/styles/globals.css"
import { AppRouterI18nProvider } from "@workspace/i18n/provider"
import { I18N_COOKIE_NAME } from "@workspace/i18n"
import { loadTranslations } from "@workspace/i18n/server"
import { Toaster } from "@workspace/ui/components/sonner"

const inter = Inter({
  subsets: ["vietnamese"],
  variable: "--font-inter",
  weight: "variable",
})

const interTight = Inter_Tight({
  subsets: ["vietnamese"],
  variable: "--font-inter-tight",
  weight: "variable",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-mono",
  weight: ["400", "500", "600"],
})

const funnelDisplay = Funnel_Display({
  subsets: ["latin-ext"],
  variable: "--font-funnel-display",
  weight: ["600"],
})

export const metadata: Metadata = {
  title: "LockIn",
  description:
    "A tool to help you stay focused and avoid distractions while working on your projects.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const requestedLocale = cookieStore.get(I18N_COOKIE_NAME)?.value
  const { locale, namespace, translations } = await loadTranslations(
    requestedLocale,
    "common"
  )

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        inter.variable,
        fontMono.variable,
        funnelDisplay.variable,
        interTight.variable,
        ibmPlexMono.variable
      )}
    >
      <body>
        <AppRouterI18nProvider
          locale={locale}
          namespace={namespace}
          translations={translations}
        >
          <Providers>{children}</Providers>
        </AppRouterI18nProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
