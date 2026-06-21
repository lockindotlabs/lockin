// In-memory registry of open SSE connections, keyed by userId. Works because
// the app runs as a single persistent Node process (PM2 fork mode, see
// ecosystem.config.cjs) — there's exactly one process holding all
// connections, so a plain module-level Map is sufficient. This would need a
// pub/sub layer (Redis, etc.) if the app ever scales to multiple instances.

type SseEvent = { type: string; data: unknown }

const connections = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>()

export function subscribe(userId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
  let set = connections.get(userId)
  if (!set) {
    set = new Set()
    connections.set(userId, set)
  }
  set.add(controller)
}

export function unsubscribe(userId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
  const set = connections.get(userId)
  if (!set) return
  set.delete(controller)
  if (set.size === 0) connections.delete(userId)
}

export function pushToUser(userId: string, event: SseEvent) {
  const set = connections.get(userId)
  if (!set || set.size === 0) return

  const payload = `data: ${JSON.stringify(event)}\n\n`
  const chunk = new TextEncoder().encode(payload)

  for (const controller of set) {
    try {
      controller.enqueue(chunk)
    } catch {
      // controller already closed — will be cleaned up by its own abort handler
    }
  }
}
