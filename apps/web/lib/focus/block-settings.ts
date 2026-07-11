export type FocusBlockSettings = {
  blocklistHard: string[]
  blocklistSoft: string[]
  tabGuard: boolean
}

export const DEFAULT_HARD_BLOCK_DOMAINS = [
  "twitter.com",
  "x.com",
  "reddit.com",
  "youtube.com",
  "tiktok.com",
  "instagram.com",
  "facebook.com",
  "twitch.tv",
  "threads.net",
  "canva.com",
]

export const DEFAULT_SOFT_BLOCK_DOMAINS = [
  "news.ycombinator.com",
  "netflix.com",
  "shopee.vn",
]

export function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
}

export function uniqueDomains(domains: string[]) {
  return Array.from(new Set(domains.map(normalizeDomain).filter(Boolean)))
}

export function withDefaultBlockSuggestions(
  settings: FocusBlockSettings
): FocusBlockSettings {
  const hasSavedBlocks =
    settings.blocklistHard.length > 0 || settings.blocklistSoft.length > 0

  if (hasSavedBlocks) {
    return {
      blocklistHard: uniqueDomains(settings.blocklistHard),
      blocklistSoft: uniqueDomains(settings.blocklistSoft),
      tabGuard: settings.tabGuard,
    }
  }

  return {
    blocklistHard: DEFAULT_HARD_BLOCK_DOMAINS,
    blocklistSoft: [],
    tabGuard: settings.tabGuard,
  }
}
