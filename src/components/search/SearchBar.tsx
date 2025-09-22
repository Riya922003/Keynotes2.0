"use client"

import React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

type Props = React.ComponentProps<typeof Input> & {
  className?: string
  value?: string
  onChange?: (value: string) => void
}

export default function SearchBar({ className, value, onChange, ...props }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // current q param if present
  const currentQ = searchParams?.get("q") ?? ""

  // internal state when uncontrolled
  const [internal, setInternal] = React.useState<string>(value ?? currentQ)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // keep internal synced if value prop changes
  React.useEffect(() => {
    if (typeof value === 'string') setInternal(value)
  }, [value])

  const updateQuery = React.useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (q) {
        params.set("q", q)
      } else {
        params.delete("q")
      }

      const url = `${pathname}?${params.toString()}`
      router.replace(url)
    },
    [router, pathname, searchParams]
  )

  const debounced = useDebouncedCallback((val: string) => {
    if (onChange) {
      onChange(val)
    } else {
      updateQuery(val)
    }
  }, 300)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInternal(v)
    debounced(v)
  }

  const clear = () => {
    setInternal('')
    if (onChange) onChange('')
    else updateQuery('')
    try { inputRef.current?.focus() } catch {}
  }

  return (
    <div className={className}>
      <div className="relative flex items-center">
        <span className="absolute left-3 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </span>
        <Input
          ref={inputRef}
          value={typeof value === 'string' ? value : internal}
          onChange={handleChange}
          className="pl-9 pr-9"
          placeholder="Search notes..."
          aria-label="Search"
          {...props}
        />
        {/* Clear button appears when there's text */}
        {(typeof value === 'string' ? value : internal) && (
          <button
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-2 inline-flex items-center justify-center w-7 h-7 rounded hover:bg-muted"
            type="button"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  )
}
