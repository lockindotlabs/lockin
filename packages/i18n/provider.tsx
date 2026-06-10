"use client"

import { createElement, useMemo } from "react"
import i18next from "i18next"
import { initReactI18next, I18nextProvider } from "react-i18next"
import {
  DEFAULT_NAMESPACE,
  FALLBACK_LOCALE,
  type AppLocale,
  type TranslationResources,
} from "."

type AppRouterI18nProviderProps = {
  children: React.ReactNode
  locale: AppLocale
  namespace?: string
  translations: TranslationResources
}

export function AppRouterI18nProvider({
  children,
  locale,
  namespace = DEFAULT_NAMESPACE,
  translations,
}: AppRouterI18nProviderProps) {
  const i18n = useMemo(() => {
    const instance = i18next.createInstance()

    void instance.use(initReactI18next).init({
      lng: locale,
      fallbackLng: FALLBACK_LOCALE,
      ns: [namespace],
      defaultNS: namespace,
      resources: {
        [locale]: {
          [namespace]: translations,
        },
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      initImmediate: false,
    })

    return instance
  }, [locale, namespace, translations])

  return createElement(I18nextProvider, { i18n }, children)
}
