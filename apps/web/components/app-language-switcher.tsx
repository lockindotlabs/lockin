"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { CheckIcon, LanguagesIcon } from "lucide-react"

import {
  getLocaleDisplayName,
  I18N_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@workspace/i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"

export function AppLanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [isPending, startTransition] = React.useTransition()
  const currentLocale = i18n.language as AppLocale

  const switchLocale = (locale: AppLocale) => {
    if (locale === currentLocale || isPending) {
      return
    }

    window.document.cookie = `${I18N_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`

    startTransition(() => {
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: locale }),
      }).finally(() => {
        window.location.reload()
      })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton disabled={isPending}>
            <LanguagesIcon data-icon="inline-start" />
            <span>
              {t("app.language.current", {
                locale: getLocaleDisplayName(currentLocale),
                defaultValue: getLocaleDisplayName(currentLocale),
              })}
            </span>
          </SidebarMenuButton>
        }
      />
      <DropdownMenuContent side="right" align="end" className="w-44">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLocale(locale)}
            className="justify-between"
          >
            <span>{getLocaleDisplayName(locale)}</span>
            {locale === currentLocale ? <CheckIcon className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
