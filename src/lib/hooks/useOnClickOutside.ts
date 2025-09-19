import { useEffect, RefObject } from 'react'

/**
 * Custom hook that triggers a handler function when a click occurs outside of the referenced element
 * @param ref - React ref object pointing to the target element
 * @param handler - Function to call when a click outside occurs
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: Event) => void
) {
  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref?.current
      
      // Do nothing if clicking ref's element or descendant elements
      if (!el || el.contains(event.target as Node)) {
        return
      }
      
      // Call the handler if clicked outside
      handler(event)
    }

    // Add event listener to document
    document.addEventListener('mousedown', listener)

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('mousedown', listener)
    }
  }, [ref, handler]) // Re-run effect if ref or handler changes
}