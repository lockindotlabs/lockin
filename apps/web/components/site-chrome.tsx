"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ChevronDown, LanguagesIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import { LogoLab } from "@/components/logo-lab"
import { Show } from "@clerk/nextjs"
import {
  getLocaleDisplayName,
  I18N_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@workspace/i18n"

/* ---- Header with scroll shadow ---- */
export function SiteHeader() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-330 border-x px-4 sm:px-6 lg:px-10">
        <div className="relative flex h-18 items-center justify-between gap-4">
          <Link href="/" className="inline-flex shrink-0 items-center">
            <LogoAccent className="h-10" />
          </Link>

          <nav
            aria-label="Main"
            className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 text-sm font-medium text-muted-foreground *:hover:text-foreground md:flex"
          >
            <Button variant="ghost" size="sm">
              <Link href="/#product">{t("landing.nav.product")}</Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Link href="/#extension">{t("landing.nav.extension")}</Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Link href="/#pricing">{t("landing.nav.pricing")}</Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Link href="/#faq">{t("landing.nav.faq")}</Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Link href="/#manifesto">{t("landing.nav.manifesto")}</Link>
            </Button>
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <Show when={"signed-out"}>
              <Button size={"lg"} variant="outline">
                <Link className="text-sm font-medium" href="/app/sign-in">
                  {t("landing.auth.signIn")}
                </Link>
              </Button>
              <Button size={"lg"}>
                <Link className="text-sm font-medium" href="/app/sign-up">
                  {t("landing.auth.getStarted")}
                </Link>
              </Button>
            </Show>

            <Show when={"signed-in"}>
              <Button size={"lg"}>
                <Link className="text-sm font-medium" href="/app">
                  {t("landing.auth.goToApp")}
                </Link>
              </Button>
            </Show>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ---- Footer ---- */
export function SiteFooter() {
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const currentLocale = i18n.language as AppLocale

  const switchLocale = (locale: AppLocale) => {
    setTimeout(() => {
      window.document.cookie = `${I18N_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`
      router.refresh()
    }, 0)
  }

  const footColClass =
    "[&>a]:block [&>a]:py-1.25 [&>a]:text-sm [&>a]:tracking-tight [&>a]:text-muted-foreground [&>a:hover]:text-foreground"
  const footHeadClass =
    "mb-4 font-mono text-[13px] font-medium tracking-widest text-muted-foreground uppercase"

  return (
    <footer className="border-t bg-background pt-16 pb-8">
      <div className="relative z-1 mx-auto max-w-330 px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="sm:col-span-3 lg:col-span-1">
            <LogoAccent className="-ml-1 h-10" />
            <p className="mt-3.5 mb-4.5 max-w-70 text-sm tracking-tight text-muted-foreground">
              {t("landing.footer.tagline")}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant={"outline"}
                    size={"lg"}
                    className={"text-sm!"}
                  />
                }
              >
                <LanguagesIcon data-icon="inline-start" />
                {getLocaleDisplayName(currentLocale)}
                <ChevronDown
                  data-icon="inline-end"
                  className="text-muted-foreground"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {SUPPORTED_LOCALES.map((locale) => (
                    <DropdownMenuItem
                      key={locale}
                      onClick={() => switchLocale(locale)}
                    >
                      {getLocaleDisplayName(locale)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className={footColClass}>
            <h4 className={footHeadClass}>{t("landing.footer.product")}</h4>
            <a href="#">{t("landing.footer.webApp")}</a>
            <a href="#">{t("landing.footer.browserExtension")}</a>
            <a href="#pricing">{t("landing.nav.pricing")}</a>
            <a href="#">{t("landing.footer.changelog")}</a>
            <a href="#">{t("landing.footer.roadmap")}</a>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t pt-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <LogoLab className="h-3 opacity-70" />
            <span className="h-3.75">©2026</span>
          </div>
          <span className="flex gap-5 [&>a:hover]:text-foreground">
            <Link href="/trust/privacy-policy">
              {t("landing.footer.privacy")}
            </Link>
            <Link href="/trust/terms-of-service">
              {t("landing.footer.terms")}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
