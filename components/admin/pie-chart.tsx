'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface PieChartProps {
  title: string
  description?: string
  labels: string[]
  data: number[]
  colors?: string[]
  height?: number
  loading?: boolean
}

export function PieChart({
  title,
  description,
  labels,
  data,
  colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
    '#f43f5e',
    '#84cc16',
  ],
  height = 300,
  loading = false,
}: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (loading || !canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Clear previous chart
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    if (labels.length === 0 || data.length === 0) {
      // Draw "No data" message
      ctx.font = '16px sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.textAlign = 'center'
      ctx.fillText('No data available', canvasRef.current.width / 2, canvasRef.current.height / 2)
      return
    }

    // Calculate total
    const total = data.reduce((sum, value) => sum + value, 0)
    if (total === 0) {
      ctx.font = '16px sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.textAlign = 'center'
      ctx.fillText('No data available', canvasRef.current.width / 2, canvasRef.current.height / 2)
      return
    }

    // Calculate center and radius
    const centerX = canvasRef.current.width / 2
    const centerY = canvasRef.current.height / 2
    const radius = Math.min(centerX, centerY) * 0.7

    // Draw pie slices
    let startAngle = 0
    for (let i = 0; i < data.length; i++) {
      const sliceAngle = (2 * Math.PI * data[i]) / total
      const endAngle = startAngle + sliceAngle

      // Draw slice
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = colors[i % colors.length]
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Calculate label position
      const midAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 0.7
      const labelX = centerX + labelRadius * Math.cos(midAngle)
      const labelY = centerY + labelRadius * Math.sin(midAngle)

      // Draw percentage if slice is big enough
      if (data[i] / total > 0.05) {
        const percentage = Math.round((data[i] / total) * 100)
        ctx.font = 'bold 14px sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${percentage}%`, labelX, labelY)
      }

      startAngle = endAngle
    }

    // Draw legend
    const legendX = canvasRef.current.width - 150
    const legendY = 40
    const legendItemHeight = 25

    for (let i = 0; i < labels.length; i++) {
      const y = legendY + i * legendItemHeight

      // Draw color box
      ctx.fillStyle = colors[i % colors.length]
      ctx.fillRect(legendX, y, 15, 15)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(legendX, y, 15, 15)

      // Draw label
      ctx.font = '12px sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const labelText = labels[i].length > 15 ? labels[i].substring(0, 15) + '...' : labels[i]
      ctx.fillText(labelText, legendX + 25, y + 7.5)
    }
  }, [labels, data, colors, height, loading])

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
