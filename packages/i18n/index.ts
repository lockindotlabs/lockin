export const I18N_COOKIE_NAME = "lockin_locale"
export const DEFAULT_LOCALE = "vi"
export const FALLBACK_LOCALE = "en"
export const DEFAULT_NAMESPACE = "common"

export const SUPPORTED_LOCALES = ["vi", "en"] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export type TranslationResources = Record<string, unknown>

export function isSupportedLocale(locale: string | undefined): locale is AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale)
}

export function getLocaleDisplayName(locale: AppLocale) {
  return locale === "vi" ? "Tiếng Việt" : "English"
}
