'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { updateNoteReminder } from '@/app/actions/noteActions'

interface ReminderPickerProps {
  noteId: string
  currentReminder?: {
    date?: Date | null
    repeat?: string | null
  }
  onReminderSetAction: (reminder: { date: Date | null, repeat: string | null }) => void
  onCloseAction: () => void
}

export default function ReminderPicker({ noteId, currentReminder, onReminderSetAction, onCloseAction }: ReminderPickerProps) {
  const [showDateTimePicker, setShowDateTimePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('20:00')
  const [selectedRepeat, setSelectedRepeat] = useState('Doesn\'t repeat')
  const [isLoading, setIsLoading] = useState(false)

  const timeOptions = [
    { label: 'Morning', value: '08:00' },
    { label: 'Afternoon', value: '13:00' },
    { label: 'Evening', value: '18:00' },
    { label: 'Night', value: '20:00' },
  ]

  const repeatOptions = [
    'Doesn\'t repeat',
    'Daily',
    'Weekly',
    'Monthly',
    'Yearly',
  ]

  // Helper function to format date for input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  // Helper function to get preset dates
  const getPresetDate = (preset: string): { date: string, time: string } => {
    const now = new Date()
    const targetDate = new Date()
    let targetTime = '20:00'

    switch (preset) {
      case 'later-today':
        // Set to 6 PM today if before 6 PM, otherwise next hour
        const currentHour = now.getHours()
        if (currentHour < 18) {
          targetTime = '18:00'
          // targetDate remains as today, no need to modify
        } else {
          targetDate.setHours(currentHour + 1)
          targetTime = `${String(targetDate.getHours()).padStart(2, '0')}:00`
        }
        break
      case 'tomorrow':
        targetDate.setDate(now.getDate() + 1)
        targetTime = '08:00'
        break
      case 'next-week':
        targetDate.setDate(now.getDate() + 7)
        targetTime = '08:00'
        break
    }

    return {
      date: formatDateForInput(targetDate),
      time: targetTime
    }
  }

  const handlePresetSelection = async (preset: string) => {
    setIsLoading(true)
    try {
      const { date, time } = getPresetDate(preset)
      await updateNoteReminder(noteId, date, time)
      
      // Create the date object to pass to callback
      const reminderDate = new Date(`${date}T${time}:00`)
  onReminderSetAction({ date: reminderDate, repeat: null })
  onCloseAction()
    } catch (error) {
      console.error('Failed to set reminder:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomDateTime = () => {
    const today = formatDateForInput(new Date())
    setSelectedDate(today)
    setShowDateTimePicker(true)
  }

  const handleSaveCustomReminder = async () => {
    if (!selectedDate || !selectedTime) {
      return
    }

    setIsLoading(true)
    try {
      await updateNoteReminder(noteId, selectedDate, selectedTime, selectedRepeat !== 'Doesn\'t repeat' ? selectedRepeat : undefined)
      
      // Create the date object to pass to callback
      const reminderDate = new Date(`${selectedDate}T${selectedTime}:00`)
      const reminderRepeat = selectedRepeat !== 'Doesn\'t repeat' ? selectedRepeat : null
  onReminderSetAction({ date: reminderDate, repeat: reminderRepeat })
  onCloseAction()
    } catch (error) {
      console.error('Failed to set custom reminder:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveReminder = async () => {
    setIsLoading(true)
    try {
      await updateNoteReminder(noteId, undefined, undefined, undefined)
  onReminderSetAction({ date: null, repeat: null })
  onCloseAction()
    } catch (error) {
      console.error('Failed to remove reminder:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (showDateTimePicker) {
    return createPortal(
      <div 
        className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center p-4"
        data-reminder-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowDateTimePicker(false)
          }
        }}
      >
        <div 
          className="bg-background border rounded-lg shadow-xl w-full max-w-xs reminder-picker-dropdown p-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowDateTimePicker(false)
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
              type="button"
            >
              ←
            </button>
            <h3 className="font-medium text-sm">Select date and time</h3>
            <button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowDateTimePicker(false)
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {/* Date Input */}
            <div>
              <label className="block text-xs font-medium mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  e.stopPropagation()
                  setSelectedDate(e.target.value)
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full p-2 text-sm border rounded-md bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Time Input */}
            <div>
              <label className="block text-xs font-medium mb-1">Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  e.stopPropagation()
                  setSelectedTime(e.target.value)
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full p-2 text-sm border rounded-md bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Time Presets */}
            <div className="grid grid-cols-2 gap-1">
              {timeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedTime === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedTime(option.value)
                  }}
                  className="text-xs h-7"
                  type="button"
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {/* Repeat Options */}
            <div>
              <label className="block text-xs font-medium mb-1">Repeat</label>
              <select
                value={selectedRepeat}
                onChange={(e) => {
                  e.stopPropagation()
                  setSelectedRepeat(e.target.value)
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="w-full p-2 text-sm border rounded-md bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {repeatOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowDateTimePicker(false)
              }}
              disabled={isLoading} 
              type="button" 
              size="sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSaveCustomReminder()
              }}
              disabled={isLoading || !selectedDate || !selectedTime} 
              type="button" 
              size="sm"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div 
      className="absolute bottom-full mb-2 -right-12 bg-background border rounded-lg shadow-lg p-2 z-[11000] min-w-[180px] reminder-picker-dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start text-sm h-8"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handlePresetSelection('later-today')
          }}
          disabled={isLoading}
        >
          Later today
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start text-sm h-8"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handlePresetSelection('tomorrow')
          }}
          disabled={isLoading}
        >
          Tomorrow
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start text-sm h-8"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handlePresetSelection('next-week')
          }}
          disabled={isLoading}
        >
          Next week
        </Button>
        <hr className="my-1" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start text-sm h-8"
          onClick={(e) => {
            e.stopPropagation()
            handleCustomDateTime()
          }}
          disabled={isLoading}
        >
          Pick date & time
        </Button>
        {currentReminder?.date && (
          <>
            <hr className="my-1" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="justify-start text-sm h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveReminder()
              }}
              disabled={isLoading}
            >
              Remove reminder
            </Button>
          </>
        )}
      </div>
    </div>
  )
}