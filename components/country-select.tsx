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
import type { Country } from '@/types/database'

interface CountrySelectProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  disabled?: boolean
}

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Select country',
  disabled = false,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)

  // Fetch countries from the database
  useEffect(() => {
    async function fetchCountries() {
      try {
        setLoading(true)
        const { data, error } = await supabaseClient.from('countries').select('*').order('name')

        if (error) {
          console.error('Error fetching countries:', error)
          return
        }

        setCountries(data as Country[])
      } catch (error) {
        console.error('Error in fetchCountries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  // Fetch the selected country when value changes
  useEffect(() => {
    async function fetchSelectedCountry() {
      if (!value) {
        setSelectedCountry(null)
        return
      }

      try {
        const { data, error } = await supabaseClient
          .from('countries')
          .select('*')
          .eq('id', value)
          .single()

        if (error) {
          console.error('Error fetching selected country:', error)
          return
        }

        setSelectedCountry(data as Country)
      } catch (error) {
        console.error('Error in fetchSelectedCountry:', error)
      }
    }

    fetchSelectedCountry()
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
          {selectedCountry ? selectedCountry.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {countries.map((country) => (
                <CommandItem
                  key={country.id}
                  value={country.name}
                  onSelect={() => {
                    onChange(country.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === country.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {country.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
