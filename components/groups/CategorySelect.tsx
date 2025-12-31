'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { CategorySelectProps } from '@/types/group-components'

/**
 * Reusable Category Select Component
 *
 * Props-based design - receives categories from parent (fetched via server action)
 * No internal data fetching - fully reusable
 */
export function CategorySelect({
  categories,
  value,
  onChange,
  label = 'Category',
  className,
}: CategorySelectProps) {
  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <Label htmlFor="category" className="text-sm">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="category" className="w-48">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.name}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
