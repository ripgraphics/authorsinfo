import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ProgressListProps {
  title: string
  description?: string
  data: {
    label: string
    value: number
    max?: number
  }[]
  className?: string
  color?: string
}

export function ProgressList({ title, description, data, className, color = "bg-blue-500" }: ProgressListProps) {
  // Find the maximum value for scaling if not provided
  const getMax = (item: { label: string; value: number; max?: number }) => {
    return item.max || Math.max(...data.map((d) => d.value), 1)
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={`${item.label}-${index}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{item.label}</div>
                <div className="text-sm">{item.value}</div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn("h-2 rounded-full", color)}
                  style={{
                    width: `${(item.value / getMax(item)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
