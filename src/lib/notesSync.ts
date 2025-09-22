// Centralized notes sync helper
// Uses BroadcastChannel when available for cross-tab updates and falls back to window events
export function emitNotesUpdated() {
  try {
    if (typeof window === 'undefined') return
    // BroadcastChannel for cross-tab messaging
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('keynotes-notes')
        bc.postMessage({ type: 'notesUpdated', ts: Date.now() })
        bc.close()
        return
      } catch {
        // fall back to window event
      }
    }

    // Fallback to window event for same-tab listeners
    try { window.dispatchEvent(new CustomEvent('notesUpdated')) } catch {}
  } catch {
    // ignore non-browser or security errors
  }
}

// Helper to subscribe to notesUpdated events (returns an unsubscribe function)
export function onNotesUpdated(cb: () => void) {
  if (typeof window === 'undefined') return () => {}

  const bcListeners: Array<() => void> = []

  // BroadcastChannel listener
  if ('BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel('keynotes-notes')
      const handler = (ev: MessageEvent) => {
        if (ev.data?.type === 'notesUpdated') cb()
      }
      bc.addEventListener('message', handler)
      bcListeners.push(() => bc.removeEventListener('message', handler))
    } catch {
      // ignore
    }
  }

  // Window event listener fallback
  const handler = () => cb()
  window.addEventListener('notesUpdated', handler)

  return () => {
    window.removeEventListener('notesUpdated', handler)
    bcListeners.forEach((fn) => fn())
  }
}
