"use client"

const PENDING_ASK_PROMPT_PREFIX = "lockin:pending-ask-prompt"

export function getPendingAskPromptKey(chatId: string) {
  return `${PENDING_ASK_PROMPT_PREFIX}:${chatId}`
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage)
}

export function savePendingAskPrompt(chatId: string, prompt: string) {
  if (!canUseSessionStorage()) return

  window.sessionStorage.setItem(getPendingAskPromptKey(chatId), prompt)
}

export function consumePendingAskPrompt(chatId: string) {
  if (!canUseSessionStorage()) return undefined

  const key = getPendingAskPromptKey(chatId)
  const prompt = window.sessionStorage.getItem(key)?.trim()

  window.sessionStorage.removeItem(key)

  return prompt || undefined
}
