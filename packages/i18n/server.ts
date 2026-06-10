import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import {
  DEFAULT_LOCALE,
  DEFAULT_NAMESPACE,
  FALLBACK_LOCALE,
  isSupportedLocale,
  type AppLocale,
  type TranslationResources,
} from "."

const cache = new Map<string, TranslationResources>()

function getLocaleDir() {
  const fromRoot = path.join(process.cwd(), "packages", "i18n", "locales")

  if (existsSync(fromRoot)) {
    return fromRoot
  }

  return path.join(process.cwd(), "..", "..", "packages", "i18n", "locales")
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function deepMerge(
  fallback: TranslationResources,
  override: TranslationResources
): TranslationResources {
  const merged: TranslationResources = { ...fallback }

  for (const [key, value] of Object.entries(override)) {
    const fallbackValue = merged[key]
    merged[key] =
      isObject(fallbackValue) && isObject(value)
        ? deepMerge(fallbackValue, value)
        : value
  }

  return merged
}

async function readNamespace(locale: AppLocale, namespace: string) {
  const cacheKey = `${locale}:${namespace}`
  const cached = cache.get(cacheKey)

  if (cached) {
    return cached
  }

  const filePath = path.join(getLocaleDir(), locale, `${namespace}.json`)
  try {
    const file = await readFile(filePath, "utf8")
    const parsed = JSON.parse(file) as TranslationResources
    cache.set(cacheKey, parsed)
    return parsed
  } catch (err: unknown) {
    // If file doesn't exist or JSON is invalid, return an empty object
    // and cache the result so we don't repeatedly attempt to read it.
    // Keep the error non-fatal so callers can fall back to other locales.
    // eslint-disable-next-line no-console
    console.warn(`i18n: could not load ${filePath}: ${String(err)}`)
    const empty: TranslationResources = {}
    cache.set(cacheKey, empty)
    return empty
  }
}

export async function loadTranslations(
  requestedLocale: string | undefined,
  namespace = DEFAULT_NAMESPACE
) {
  const locale = isSupportedLocale(requestedLocale)
    ? requestedLocale
    : DEFAULT_LOCALE

  const fallbackTranslations = await readNamespace(FALLBACK_LOCALE, namespace)

  if (locale === FALLBACK_LOCALE) {
    return {
      locale,
      namespace,
      translations: fallbackTranslations,
    }
  }

  const localeTranslations = await readNamespace(locale, namespace)

  return {
    locale,
    namespace,
    translations: deepMerge(fallbackTranslations, localeTranslations),
  }
}
