export function hasStepGuidance(guidance: string | null | undefined) {
  return Boolean(guidance?.trim())
}

export const STEP_GUIDANCE_CONTENT_CLASS =
  "mt-2 max-h-32 overflow-y-auto rounded-lg border border-amber-400/20 bg-background/45 px-3 py-2 text-xs leading-6 whitespace-pre-line text-muted-foreground shadow-inner"

export const STEP_GUIDANCE_COLLAPSIBLE_CLASS =
  "mt-3 border-t border-border/60 pt-2 text-left"
