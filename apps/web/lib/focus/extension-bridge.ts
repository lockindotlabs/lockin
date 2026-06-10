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

/**
 * Best-effort push of a state-change message to the connected extension.
 * Silently no-ops if there's no remembered extension, the browser isn't
 * Chrome, or the extension isn't installed/running — the poll-based sync
 * in background.js is the safety net for all of those cases.
 */
function notifyExtension(message: Record<string, unknown>) {
  const extId = getRememberedExtensionId()
  const chromeApi = getChromeApi()
  if (!extId || !chromeApi?.runtime?.sendMessage) return

  try {
    chromeApi.runtime.sendMessage(extId, message, () => {
      // Reading lastError here prevents Chrome from logging an "unchecked
      // runtime.lastError" warning when the extension isn't reachable.
      void chromeApi.runtime?.lastError
    })
  } catch {
    // sendMessage can throw synchronously if the extension ID is malformed.
  }
}

/** Tell the extension a sprint just started in the app, so it can mirror it immediately. */
export function notifyExtensionSessionStarted(params: {
  sessionId: string
  planId: string | null
  taskName: string
  duration: number
  startTime: number
  tasks: Array<{ id?: string; label: string; done: boolean; durationMinutes?: number }>
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
