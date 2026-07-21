import {
  DEFAULT_LOCALE,
  I18N_COOKIE_NAME,
  isSupportedLocale,
  type AppLocale,
} from "@workspace/i18n"
import prisma from "@workspace/db"

const HEADER_LOCALE_NAMES = ["x-lockin-locale", "x-locale", "accept-language"]

function parseCookie(header: string | null, name: string) {
  if (!header) {
    return undefined
  }

  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

function parseHeaderLocale(value: string | null) {
  if (!value) {
    return undefined
  }

  const [locale] = value.split(",")[0]?.trim().split("-") ?? []
  return locale
}

export async function getRequestLocale(
  req: Request,
  userId?: string
): Promise<AppLocale> {
  const cookieLocale = parseCookie(req.headers.get("cookie"), I18N_COOKIE_NAME)
  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale
  }

  for (const headerName of HEADER_LOCALE_NAMES) {
    const locale = parseHeaderLocale(req.headers.get(headerName))
    if (isSupportedLocale(locale)) {
      return locale
    }
  }

  if (userId) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { language: true },
    })
    const language = settings?.language ?? undefined

    if (isSupportedLocale(language)) {
      return language
    }
  }

  return DEFAULT_LOCALE
}

export function getAiLanguageInstruction(locale: AppLocale) {
  if (locale === "vi") {
    return `# Output language

The product locale is Vietnamese.
- Reply in natural Vietnamese for all user-visible assistant text.
- When calling tools that create plans, questions, option labels, task titles, task descriptions, or guidance, write those user-visible fields in Vietnamese.
- Keep user-provided names, code identifiers, quoted text, file paths, URLs, commands, and official product names unchanged unless the user explicitly asks to translate them.
- If the user explicitly asks for a different language in their latest message, follow that explicit request for that response.`
  }

  return `# Output language

The product locale is English.
- Reply in natural English for all user-visible assistant text.
- When calling tools that create plans, questions, option labels, task titles, task descriptions, or guidance, write those user-visible fields in English.
- Keep user-provided names, code identifiers, quoted text, file paths, URLs, commands, and official product names unchanged unless the user explicitly asks to translate them.
- If the user explicitly asks for a different language in their latest message, follow that explicit request for that response.`
}

export function getHttpLocale(locale: AppLocale) {
  return locale === "vi" ? "vi-VN" : "en-US"
}
