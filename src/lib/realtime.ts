// Per-user in-memory SSE broadcaster
// Map of userId -> Set of ReadableStream controllers
const userControllers = new Map<string, Set<ReadableStreamDefaultController>>()
const encoder = new TextEncoder()

function ensureSet(userId: string) {
  if (!userControllers.has(userId)) userControllers.set(userId, new Set())
  return userControllers.get(userId)!
}

export function subscribe(userId: string, controller: ReadableStreamDefaultController) {
  ensureSet(userId).add(controller)
}

export function unsubscribe(userId: string, controller: ReadableStreamDefaultController) {
  const s = userControllers.get(userId)
  if (!s) return
  s.delete(controller)
  if (s.size === 0) userControllers.delete(userId)
}

function formatSSE(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  return encoder.encode(payload)
}

// Broadcast to a list of userIds; if recipients omitted, broadcast to all connected users
export function broadcastNotesUpdated(payload: unknown = { type: 'notesUpdated', ts: Date.now() }, recipients?: string[]) {
  const chunk = formatSSE('notesUpdated', payload)

  if (!recipients || recipients.length === 0) {
    // broadcast to all
    for (const [, controllers] of userControllers) {
      for (const controller of Array.from(controllers)) {
        try { controller.enqueue(chunk) } catch (err) { controllers.delete(controller) }
      }
    }
    return
  }

  for (const uid of recipients) {
    const controllers = userControllers.get(uid)
    if (!controllers) continue
    for (const controller of Array.from(controllers)) {
      try { controller.enqueue(chunk) } catch (err) { controllers.delete(controller) }
    }
  }
}

// Periodic ping to keep connections alive across all controllers
setInterval(() => {
  const ping = encoder.encode(': ping\n\n')
  for (const [, controllers] of userControllers) {
    for (const controller of Array.from(controllers)) {
      try { controller.enqueue(ping) } catch { controllers.delete(controller) }
    }
  }
}, 20000)

export default {}
