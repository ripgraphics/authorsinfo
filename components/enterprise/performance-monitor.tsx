'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  Clock, 
  BarChart3,
  RefreshCw,
  Info
} from 'lucide-react'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  apiCallTime: number
  cacheHitRate: number
  componentRenders: number
  timestamp: Date
}

interface PerformanceMonitorProps {
  componentName: string
  showDetails?: boolean
  className?: string
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName,
  showDetails = false,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(showDetails)
  const renderStartTime = useRef<number>(0)
  const renderCount = useRef<number>(0)

  // Start monitoring render time
  useEffect(() => {
    renderStartTime.current = performance.now()
    renderCount.current++
    
    const renderTime = performance.now() - renderStartTime.current
    
    if (isMonitoring) {
      setMetrics(prev => [...prev, {
        renderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        apiCallTime: 0,
        cacheHitRate: 0,
        componentRenders: renderCount.current,
        timestamp: new Date()
      }])
    }
  })

  const startMonitoring = () => {
    setIsMonitoring(true)
    setMetrics([])
    renderCount.current = 0
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
  }

  const clearMetrics = () => {
    setMetrics([])
    renderCount.current = 0
  }

  const getAverageRenderTime = () => {
    if (metrics.length === 0) return 0
    const total = metrics.reduce((sum, m) => sum + m.renderTime, 0)
    return total / metrics.length
  }

  const getPerformanceScore = () => {
    const avgRenderTime = getAverageRenderTime()
    if (avgRenderTime < 16) return { score: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (avgRenderTime < 33) return { score: 'Good', color: 'bg-blue-100 text-blue-800' }
    if (avgRenderTime < 50) return { score: 'Fair', color: 'bg-yellow-100 text-yellow-800' }
    return { score: 'Poor', color: 'bg-red-100 text-red-800' }
  }

  const performanceScore = getPerformanceScore()

  return (
    <Card className={`performance-monitor ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Monitoring" : "Idle"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Component: {componentName}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Performance Score */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-600" />
            <span className="font-medium">Performance Score</span>
          </div>
          <Badge className={performanceScore.color}>
            {performanceScore.score}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {getAverageRenderTime().toFixed(1)}ms
            </div>
            <div className="text-sm text-blue-600">Avg Render Time</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {renderCount.current}
            </div>
            <div className="text-sm text-green-600">Total Renders</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isMonitoring ? (
            <Button onClick={startMonitoring} size="sm" className="flex-1">
              <Activity className="h-4 w-4 mr-2" />
              Start Monitoring
            </Button>
          ) : (
            <Button onClick={stopMonitoring} size="sm" variant="outline" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Stop Monitoring
            </Button>
          )}
          
          <Button onClick={clearMetrics} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            size="sm" 
            variant="outline"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Advanced Metrics */}
        {showAdvanced && metrics.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Detailed Metrics
            </h4>
            
            <div className="max-h-40 overflow-y-auto space-y-2">
              {metrics.slice(-10).reverse().map((metric, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-sm">
                  <span className="text-muted-foreground">
                    {metric.timestamp.toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-4">
                    <span>Render: {metric.renderTime.toFixed(1)}ms</span>
                    <span>Memory: {(metric.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Tips */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Performance Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Target render time: &lt;16ms for 60fps</li>
                <li>• Use React.memo for expensive components</li>
                <li>• Implement virtual scrolling for large lists</li>
                <li>• Cache API responses when possible</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PerformanceMonitor
