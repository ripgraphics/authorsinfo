"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface LineChartProps {
  title: string
  description?: string
  labels: string[]
  data: number[]
  color?: string
  height?: number
  loading?: boolean
}

export function LineChart({
  title,
  description,
  labels,
  data,
  color = "#3b82f6",
  height = 300,
  loading = false,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (loading || !canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clear previous chart
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    if (labels.length === 0 || data.length === 0) {
      // Draw "No data" message
      ctx.font = "16px sans-serif"
      ctx.fillStyle = "#6b7280"
      ctx.textAlign = "center"
      ctx.fillText("No data available", canvasRef.current.width / 2, canvasRef.current.height / 2)
      return
    }

    // Find max value for scaling
    const maxValue = Math.max(...data, 1) // Ensure at least 1 to avoid division by zero
    const padding = 40
    const chartWidth = canvasRef.current.width - padding * 2
    const chartHeight = canvasRef.current.height - padding * 2

    // Draw axes
    ctx.beginPath()
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, canvasRef.current.height - padding)
    ctx.lineTo(canvasRef.current.width - padding, canvasRef.current.height - padding)
    ctx.stroke()

    // Draw y-axis labels
    ctx.font = "12px sans-serif"
    ctx.fillStyle = "#6b7280"
    ctx.textAlign = "right"
    const yLabelCount = 5
    for (let i = 0; i <= yLabelCount; i++) {
      const value = Math.round((maxValue * i) / yLabelCount)
      const y = canvasRef.current.height - padding - (i * chartHeight) / yLabelCount
      ctx.fillText(value.toString(), padding - 10, y + 4)

      // Draw horizontal grid line
      ctx.beginPath()
      ctx.strokeStyle = "#f3f4f6"
      ctx.moveTo(padding, y)
      ctx.lineTo(canvasRef.current.width - padding, y)
      ctx.stroke()
    }

    // Draw x-axis labels (show fewer labels if there are many)
    ctx.textAlign = "center"
    const labelStep = Math.max(1, Math.ceil(labels.length / 10))
    for (let i = 0; i < labels.length; i += labelStep) {
      const x = padding + (i * chartWidth) / (labels.length - 1 || 1)
      ctx.fillText(labels[i], x, canvasRef.current.height - padding + 20)
    }

    // Draw data line
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = "round"

    // Draw points and line
    for (let i = 0; i < data.length; i++) {
      const x = padding + (i * chartWidth) / (data.length - 1 || 1)
      const y = canvasRef.current.height - padding - (data[i] * chartHeight) / maxValue

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Draw area under the line
    ctx.lineTo(padding + chartWidth, canvasRef.current.height - padding)
    ctx.lineTo(padding, canvasRef.current.height - padding)
    ctx.closePath()
    ctx.fillStyle = `${color}20` // Add transparency
    ctx.fill()

    // Draw points
    for (let i = 0; i < data.length; i++) {
      const x = padding + (i * chartWidth) / (data.length - 1 || 1)
      const y = canvasRef.current.height - padding - (data[i] * chartHeight) / maxValue

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }, [labels, data, color, height, loading])

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
