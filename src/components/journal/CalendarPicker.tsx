'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'

interface CalendarPickerProps {
  onSelectAction: (date: string) => void
}

export default function CalendarPicker({ onSelectAction }: CalendarPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-10 h-10 ml-2" aria-label="Open calendar">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      {/* Use zero outer padding so the Calendar's internal layout aligns correctly;
          apply a consistent inner padding wrapper to ensure symmetric spacing */}
      <PopoverContent align="end" className="w-[320px] p-0">
        <div className="p-3">
          <div className="text-sm font-medium mb-2">Pick a date</div>
          <Calendar
            mode="single"
            onSelect={(d) => {
              if (!d) return
              const iso = format(d as Date, 'yyyy-MM-dd')
              onSelectAction(iso)
              setOpen(false)
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
