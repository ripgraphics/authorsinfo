'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { ActivityLevelSelectProps } from '@/types/group-components'

/**
 * Reusable Activity Level Select Component
 *
 * Props-based design - receives activity level definitions from parent (fetched via server action)
 * No internal data fetching - fully reusable
 */
export function ActivityLevelSelect({
  activityLevels,
  value,
  onChange,
  label = 'Activity Level',
  className,
}: ActivityLevelSelectProps) {
  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <Label htmlFor="activity" className="text-sm">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="activity" className="w-48">
          <SelectValue placeholder="All Activity Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Activity Levels</SelectItem>
          {activityLevels.map((level) => (
            <SelectItem key={level.id} value={level.level_key}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
