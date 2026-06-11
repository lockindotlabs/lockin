export const MENTION_TYPES = [
  "current-thread",
  "current-plan",
  "plan",
  "chat",
  "date",
] as const

export type MentionType = (typeof MENTION_TYPES)[number]

export type MentionRef = {
  type: MentionType
  id: string
  label: string
}

export function isMentionType(value: unknown): value is MentionType {
  return (
    typeof value === "string" &&
    MENTION_TYPES.includes(value as MentionType)
  )
}

export function isMentionRef(value: unknown): value is MentionRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    isMentionType(value.type) &&
    "id" in value &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    "label" in value &&
    typeof value.label === "string" &&
    value.label.length > 0
  )
}

export function getMentionKey(mention: Pick<MentionRef, "type" | "id">) {
  return `${mention.type}:${mention.id}`
}
