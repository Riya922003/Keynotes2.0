"use client"

import * as React from 'react'
import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

type SelectContextType = {
  value: string
  setValue: (v: string) => void
}

const SelectContext = createContext<SelectContextType | null>(null)

type SelectProps = {
  children: React.ReactNode
  defaultValue?: string
  onValueChange?: (val: string) => void
}

export function Select({ children, defaultValue, onValueChange }: SelectProps) {
  const [value, setValue] = useState<string>(defaultValue ?? '')
  const [open, setOpen] = useState<boolean | undefined>(undefined)

  const setValueAndNotify = (v: string) => {
    setValue(v)
    if (onValueChange) onValueChange(v)
  }

  return (
    <DropdownMenu open={open} onOpenChange={(o) => setOpen(o)}>
      <SelectContext.Provider value={{ value, setValue: setValueAndNotify }}>{children}</SelectContext.Provider>
    </DropdownMenu>
  )
}

export function SelectTrigger({ children, className }: { children?: React.ReactNode; className?: string }) {
  const ctx = useContext(SelectContext)
  const display = ctx?.value || ''

  return (
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={cn(
          'flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <span className="truncate">{display || children}</span>
        <ChevronDown className="ml-auto h-4 w-4 opacity-70" />
      </button>
    </DropdownMenuTrigger>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(SelectContext)
  const val = ctx?.value || ''
  return <span>{val || placeholder || ''}</span>
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <DropdownMenuContent>{children}</DropdownMenuContent>
}

export function SelectItem({ value, children }: { value: string; children?: React.ReactNode }) {
  const ctx = useContext(SelectContext)
  return (
    <DropdownMenuItem
      onClick={() => {
        ctx?.setValue(value)
        // attempt to close the dropdown after selection by dispatching a click on the document body
        // also try to use Radix state by blurring the active element
        try {
          ;(document.activeElement as HTMLElement | null)?.blur()
        } catch {}
      }}
    >
      {children}
    </DropdownMenuItem>
  )
}

export default Select
