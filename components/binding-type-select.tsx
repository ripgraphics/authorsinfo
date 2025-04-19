"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabaseClient } from "@/lib/supabase/client"

interface BindingType {
  id: number
  name: string
  description?: string
}

interface BindingTypeSelectProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  disabled?: boolean
}

export function BindingTypeSelect({
  value,
  onChange,
  placeholder = "Select binding type",
  disabled = false,
}: BindingTypeSelectProps) {
  const [open, setOpen] = useState(false)
  const [bindingTypes, setBindingTypes] = useState<BindingType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBindingType, setSelectedBindingType] = useState<BindingType | null>(null)

  // Fetch binding types from the database
  useEffect(() => {
    async function fetchBindingTypes() {
      try {
        setLoading(true)
        const { data, error } = await supabaseClient.from("binding_types").select("*").order("name")

        if (error) {
          console.error("Error fetching binding types:", error)
          return
        }

        setBindingTypes(data as BindingType[])
      } catch (error) {
        console.error("Error in fetchBindingTypes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBindingTypes()
  }, [])

  // Fetch the selected binding type when value changes
  useEffect(() => {
    async function fetchSelectedBindingType() {
      if (!value) {
        setSelectedBindingType(null)
        return
      }

      try {
        const { data, error } = await supabaseClient.from("binding_types").select("*").eq("id", value).single()

        if (error) {
          console.error("Error fetching selected binding type:", error)
          return
        }

        setSelectedBindingType(data as BindingType)
      } catch (error) {
        console.error("Error in fetchSelectedBindingType:", error)
      }
    }

    fetchSelectedBindingType()
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
          {selectedBindingType ? selectedBindingType.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search binding type..." />
          <CommandList>
            <CommandEmpty>No binding type found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {bindingTypes.map((bindingType) => (
                <CommandItem
                  key={bindingType.id}
                  value={bindingType.name}
                  onSelect={() => {
                    onChange(bindingType.id)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === bindingType.id ? "opacity-100" : "opacity-0")} />
                  {bindingType.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
