"use client"

import * as React from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  label?: string
  error?: string
  className?: string
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ value, onChange, label, error, className }, ref) => {
    const [date, setDate] = React.useState<Date>(value || new Date())

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = new Date(e.target.value)
      setDate(newDate)
      onChange?.(newDate)
    }

    return (
      <div className={cn("flex flex-col gap-2", className)} ref={ref}>
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          type="date"
          value={format(date, "yyyy-MM-dd")}
          onChange={handleDateChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/25 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
DatePicker.displayName = "DatePicker"

export { DatePicker } 