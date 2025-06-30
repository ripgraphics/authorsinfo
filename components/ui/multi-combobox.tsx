"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface Option {
  value: string
  label: string
}

interface MultiComboboxProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  onSearch?: (search: string) => void
  onScrollEnd?: () => void
  loading?: boolean
}

export function MultiCombobox({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  emptyMessage = "No options found.",
  className,
  onSearch,
  onScrollEnd,
  loading = false,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const commandRef = React.useRef<HTMLDivElement>(null)

  // Handle scroll to load more
  React.useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement
      if (!onScrollEnd) return

      // Load more when user scrolls to 80% of the list
      if (target.scrollTop + target.clientHeight >= target.scrollHeight * 0.8) {
        onScrollEnd()
      }
    }

    const commandList = commandRef.current?.querySelector("[cmdk-list]")
    commandList?.addEventListener("scroll", handleScroll)

    return () => {
      commandList?.removeEventListener("scroll", handleScroll)
    }
  }, [onScrollEnd])

  // Use a ref to store the timeout ID for proper cleanup
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>()

  // Handle search input with proper debouncing
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchValue(value)
    if (onSearch) {
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      
      // Set a new timeout
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(value)
      }, 300) // 300ms debounce
    }
  }, [onSearch])

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue("")
    }
  }, [open])

  // Get selected item labels
  const selectedLabels = selected.map((value) => {
    const option = options.find((option) => option.value === value)
    return option ? option.label : value
  })

  // Remove an item
  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value))
  }

  // Clear all selected items
  const handleClear = () => {
    onChange([])
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="w-full">
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              onClick={() => setOpen(!open)}
              type="button"
            >
              {selected.length > 0 ? `${selected.length} selected` : placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command ref={commandRef} className="w-full">
            <CommandInput 
              placeholder="Search..." 
              value={searchValue} 
              onValueChange={handleSearchChange}
            />
            <CommandList className="max-h-60 overflow-auto">
              <CommandEmpty>
                {loading ? "Loading..." : emptyMessage}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(
                        selected.includes(option.value)
                          ? selected.filter((item) => item !== option.value)
                          : [...selected, option.value],
                      )
                      // Close the popover after selection if only one item is allowed
                      if (selected.length === 0) {
                        setOpen(false)
                      }
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {loading && (
                  <div className="py-2 px-4 text-sm text-center text-muted-foreground">
                    Loading more options...
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => {
            const label = selectedLabels[selected.indexOf(value)] || value
            return (
              <Badge key={value} variant="secondary" className="px-2 py-1">
                {label}
                <button
                  type="button"
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => handleRemove(value)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  <span className="sr-only">Remove {label}</span>
                </button>
              </Badge>
            )
          })}
          {selected.length > 1 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleClear} type="button">
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
