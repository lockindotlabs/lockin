import { getAuthenticatedUser } from "@/lib/server/auth"
import { subscribe, unsubscribe } from "@/lib/server/sse-registry"

// Keeps the connection open and pushes `session-start` / `session-end`
// events as they happen server-side (see lib/server/sse-registry.ts).
// Consumed by the Chrome extension's background.js via a manual fetch +
// ReadableStream read loop — `EventSource` can't send the Authorization
// header a service worker needs, so this is read as raw `data: {...}` lines
// rather than through the EventSource API on the client.
export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  let activeController: ReadableStreamDefaultController<Uint8Array> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      activeController = controller
      subscribe(user.id, controller)
      // Initial comment line so the client sees bytes immediately and can
      // confirm the connection is live before the first real event.
      controller.enqueue(new TextEncoder().encode(": connected\n\n"))
    },
    cancel() {
      if (activeController) unsubscribe(user.id, activeController)
    },
  })

  req.signal.addEventListener("abort", () => {
    if (activeController) unsubscribe(user.id, activeController)
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
