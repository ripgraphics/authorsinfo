"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BarChartProps {
  title: string
  description?: string
  data: {
    label: string
    value: number
  }[]
  className?: string
  color?: string
}

export function BarChart({ title, description, data, className, color = "bg-blue-500" }: BarChartProps) {
  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map((item) => item.value), 1)

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-end justify-between gap-2">
          {data.map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div className="w-full flex flex-col items-center">
                <div
                  className={cn("w-12 rounded-t-sm", color)}
                  style={{ height: `${Math.max(10, (item.value / maxValue) * 180)}px` }}
                ></div>
              </div>
              <div className="text-xs mt-2 text-muted-foreground">{item.label}</div>
              <div className="text-xs font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
