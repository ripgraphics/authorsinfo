'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { supabaseClient } from '@/lib/supabase/client'

interface FormatType {
  id: number
  name: string
  description?: string
}

interface FormatTypeSelectProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  disabled?: boolean
}

export function FormatTypeSelect({
  value,
  onChange,
  placeholder = 'Select format type',
  disabled = false,
}: FormatTypeSelectProps) {
  const [open, setOpen] = useState(false)
  const [formatTypes, setFormatTypes] = useState<FormatType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFormatType, setSelectedFormatType] = useState<FormatType | null>(null)

  // Fetch format types from the database
  useEffect(() => {
    async function fetchFormatTypes() {
      try {
        setLoading(true)
        const { data, error } = await supabaseClient.from('format_types').select('*').order('name')

        if (error) {
          console.error('Error fetching format types:', error)
          return
        }

        setFormatTypes(data as FormatType[])
      } catch (error) {
        console.error('Error in fetchFormatTypes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFormatTypes()
  }, [])

  // Fetch the selected format type when value changes
  useEffect(() => {
    async function fetchSelectedFormatType() {
      if (!value) {
        setSelectedFormatType(null)
        return
      }

      try {
        const { data, error } = await supabaseClient
          .from('format_types')
          .select('*')
          .eq('id', value)
          .single()

        if (error) {
          console.error('Error fetching selected format type:', error)
          return
        }

        setSelectedFormatType(data as FormatType)
      } catch (error) {
        console.error('Error in fetchSelectedFormatType:', error)
      }
    }

    fetchSelectedFormatType()
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedFormatType ? selectedFormatType.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search format type..." />
          <CommandList>
            <CommandEmpty>No format type found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {formatTypes.map((formatType) => (
                <CommandItem
                  key={formatType.id}
                  value={formatType.name}
                  onSelect={() => {
                    onChange(formatType.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === formatType.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {formatType.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
