"use client"

// ─── Extension bridge ─────────────────────────────────────────────────────────
//
// The web app is the single source of truth for sprint control now — pause,
// extend, end, and start all live here (the extension popup is read-only).
// For the extension to actually *follow* the app instead of running its own
// independent timer, it needs to learn about state changes as they happen,
// not just whenever its periodic poll happens to fire.
//
// This module remembers the connected extension's ID (captured once during
// the connect-extension handshake) and pushes lightweight "this just
// happened" messages to it via `chrome.runtime.sendMessage(extId, ...)`.
// The extension's poll-based sync (background.js `session-poll`) remains as
// a fallback for when the push can't be delivered (extension reloading,
// browser closed, message dropped, etc).

const EXT_ID_STORAGE_KEY = "lockin_ext_id"
export const LOCKIN_EXTENSION_ID = "iljcddaihcbaldbimpgmecbllhblacol"
export const LOCKIN_EXTENSION_STORE_URL =
  "https://chromewebstore.google.com/detail/iljcddaihcbaldbimpgmecbllhblacol?utm_source=item-share-cb"

function getChromeApi(): { runtime?: { sendMessage?: Function; lastError?: unknown } } | null {
  if (typeof window === "undefined") return null
  return (window as unknown as { chrome?: any }).chrome ?? null
}

/** Persist the extension ID after a successful connect handshake. */
export function rememberExtensionId(extId: string) {
  try {
    localStorage.setItem(EXT_ID_STORAGE_KEY, extId)
  } catch {
    // localStorage unavailable (private mode, etc) — push notifications
    // simply won't fire; the extension's poll fallback still covers it.
  }
}

function getRememberedExtensionId(): string | null {
  try {
    return localStorage.getItem(EXT_ID_STORAGE_KEY)
  } catch {
    return null
  }
}

export function hasRememberedExtensionConnection() {
  return getRememberedExtensionId() !== null
}

export function detectExtensionInstalled(timeoutMs = 800): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)

  const chromeApi = getChromeApi()
  const extIds = [getRememberedExtensionId(), LOCKIN_EXTENSION_ID].filter(
    Boolean
  ) as string[]

  const directPing = extIds.map(
    (extId) =>
      new Promise<boolean>((resolve) => {
        if (!chromeApi?.runtime?.sendMessage) {
          resolve(false)
          return
        }

        try {
          chromeApi.runtime.sendMessage(
            extId,
            { type: "lockin-extension-ping" },
            (response: { ok?: boolean; type?: string } | undefined) => {
              resolve(Boolean(response?.ok || response?.type === "lockin-extension-pong"))
            }
          )
        } catch {
          resolve(false)
        }
      })
  )

  const contentScriptPing = new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("lockin-extension-detected", onDetected)
      resolve(false)
    }, timeoutMs)

    const onDetected = () => {
      window.clearTimeout(timer)
      window.removeEventListener("lockin-extension-detected", onDetected)
      resolve(true)
    }

    window.addEventListener("lockin-extension-detected", onDetected)
    window.dispatchEvent(new CustomEvent("lockin-extension-detect"))
  })

  return Promise.race([
    Promise.all([...directPing, contentScriptPing]).then((results) =>
      results.some(Boolean)
    ),
    new Promise<boolean>((resolve) =>
      window.setTimeout(() => resolve(hasRememberedExtensionConnection()), timeoutMs + 100)
    ),
  ])
}

/**
 * Best-effort push of a state-change message to the connected extension.
 * Tries a direct `chrome.runtime.sendMessage(extId, ...)` first — this
 * reaches background.js regardless of tab visibility/throttling. Falls back
 * to the CustomEvent (relayed by content.js, only works while the lockin.app
 * tab is active/foreground) when there's no remembered extension yet or the
 * direct send fails. The SSE stream and 30s alarm poll in background.js are
 * the safety net for when both of these miss (extension reloading, browser
 * closed, message dropped, etc).
 */
function notifyExtension(message: Record<string, unknown>) {
  if (typeof window === "undefined") return

  const extId = getRememberedExtensionId()
  const chromeApi = getChromeApi()

  if (extId && chromeApi?.runtime?.sendMessage) {
    chromeApi.runtime.sendMessage(extId, message, () => {
      if (chromeApi.runtime?.lastError) {
        window.dispatchEvent(new CustomEvent("lockin-app-to-extension", { detail: message }))
      }
    })
    return
  }

  window.dispatchEvent(new CustomEvent("lockin-app-to-extension", { detail: message }))
}

/** Tell the extension a sprint just started in the app, so it can mirror it immediately. */
export function notifyExtensionSessionStarted(params: {
  sessionId: string
  planId: string | null
  taskName: string
  duration: number
  startTime: number
  tasks: Array<{ id?: string; label: string; done: boolean; durationMinutes?: number }>
  blocklistHard?: string[]
  blocklistSoft?: string[]
  tabGuard?: boolean
}) {
  notifyExtension({ type: "lockin-session-start", ...params })
}

/** Tell the extension a sprint just ended in the app, so it stops its local timer. */
export function notifyExtensionSessionEnded(params: {
  sessionId: string
  completionType: "EARLY" | "NORMAL" | "OVERTIME"
}) {
  notifyExtension({ type: "lockin-session-end", ...params })
}

// Pause/resume are purely local UI state in the session page — never
// persisted server-side (no API field, nothing to poll). This push is the
// ONLY channel through which the extension can learn the sprint was paused;
// without it the extension's timer just keeps counting down regardless of
// what the app shows.
export function notifyExtensionSessionPaused(sessionId: string) {
  notifyExtension({ type: "lockin-session-pause", sessionId })
}

export function notifyExtensionSessionResumed(sessionId: string) {
  notifyExtension({ type: "lockin-session-resume", sessionId })
}

export function notifyExtensionSessionExtended(sessionId: string, extraSeconds: number) {
  notifyExtension({ type: "lockin-session-extend", sessionId, extraSeconds })
}

/** Push updated task list + adjusted remaining time to extension when a step is toggled. */
export function notifyExtensionTasksUpdated(
  tasks: Array<{ id?: string; label: string; done: boolean; durationMinutes?: number }>,
  remainingSeconds: number
) {
  notifyExtension({ type: "lockin-tasks-update", tasks, remainingSeconds })
}
