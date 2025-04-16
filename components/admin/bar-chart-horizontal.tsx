"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface BarChartHorizontalProps {
  title: string
  description?: string
  labels: string[]
  data: number[]
  color?: string
  height?: number
  loading?: boolean
  maxBars?: number
}

export function BarChartHorizontal({
  title,
  description,
  labels,
  data,
  color = "#3b82f6",
  height = 300,
  loading = false,
  maxBars = 10,
}: BarChartHorizontalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (loading || !canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clear previous chart
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    // Limit the number of bars
    const limitedLabels = labels.slice(0, maxBars)
    const limitedData = data.slice(0, maxBars)

    if (limitedLabels.length === 0 || limitedData.length === 0) {
      // Draw "No data" message
      ctx.font = "16px sans-serif"
      ctx.fillStyle = "#6b7280"
      ctx.textAlign = "center"
      ctx.fillText("No data available", canvasRef.current.width / 2, canvasRef.current.height / 2)
      return
    }

    // Find max value for scaling
    const maxValue = Math.max(...limitedData, 1) // Ensure at least 1 to avoid division by zero
    const padding = { left: 150, right: 40, top: 20, bottom: 20 }
    const chartWidth = canvasRef.current.width - padding.left - padding.right
    const chartHeight = canvasRef.current.height - padding.top - padding.bottom
    const barHeight = Math.min(25, (chartHeight / limitedLabels.length) * 0.8)
    const barSpacing = (chartHeight - barHeight * limitedLabels.length) / (limitedLabels.length + 1)

    // Draw x-axis
    ctx.beginPath()
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, canvasRef.current.height - padding.bottom)
    ctx.stroke()

    // Draw x-axis labels
    ctx.font = "12px sans-serif"
    ctx.fillStyle = "#6b7280"
    ctx.textAlign = "center"
    const xLabelCount = 5
    for (let i = 0; i <= xLabelCount; i++) {
      const value = Math.round((maxValue * i) / xLabelCount)
      const x = padding.left + (i * chartWidth) / xLabelCount
      ctx.fillText(value.toString(), x, canvasRef.current.height - padding.bottom + 15)

      // Draw vertical grid line
      ctx.beginPath()
      ctx.strokeStyle = "#f3f4f6"
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, canvasRef.current.height - padding.bottom)
      ctx.stroke()
    }

    // Draw bars and labels
    for (let i = 0; i < limitedLabels.length; i++) {
      const y = padding.top + barSpacing * (i + 1) + barHeight * i

      // Draw label
      ctx.fillStyle = "#6b7280"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(
        limitedLabels[i].length > 20 ? limitedLabels[i].substring(0, 20) + "..." : limitedLabels[i],
        padding.left - 10,
        y + barHeight / 2 + 4,
      )

      // Draw bar
      const barWidth = (limitedData[i] / maxValue) * chartWidth
      ctx.fillStyle = color
      ctx.fillRect(padding.left, y, barWidth, barHeight)

      // Draw value at the end of the bar
      ctx.fillStyle = "#6b7280"
      ctx.textAlign = "left"
      ctx.fillText(limitedData[i].toString(), padding.left + barWidth + 5, y + barHeight / 2 + 4)
    }
  }, [labels, data, color, height, loading, maxBars])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full h-[300px]" />
        ) : (
          <canvas ref={canvasRef} width={800} height={height} className="w-full h-auto" />
        )}
      </CardContent>
    </Card>
  )
}
