'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const hours = date?.getHours() || 0
      const minutes = date?.getMinutes() || 0
      newDate.setHours(hours)
      newDate.setMinutes(minutes)
    }
    setDate(newDate)
  }

  const handleTimeChange = (value: string, unit: 'hours' | 'minutes') => {
    if (date) {
      const newDate = new Date(date)
      if (unit === 'hours') {
        newDate.setHours(parseInt(value, 10))
      } else {
        newDate.setMinutes(parseInt(value, 10))
      }
      setDate(newDate)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? format(date, 'PPP HH:mm') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={handleDateChange}
          initialFocus
        />
        <div className='p-4 border-t border-border flex items-center gap-2'>
          <Select
            onValueChange={(value) => handleTimeChange(value, 'hours')}
            defaultValue={date ? format(date, 'HH') : '00'}
          >
            <SelectTrigger className='w-[80px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={String(i).padStart(2, '0')}>
                  {String(i).padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>:</span>
          <Select
            onValueChange={(value) => handleTimeChange(value, 'minutes')}
            defaultValue={date ? format(date, 'mm') : '00'}
          >
            <SelectTrigger className='w-[80px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 60 }, (_, i) => (
                <SelectItem key={i} value={String(i).padStart(2, '0')}>
                  {String(i).padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}
