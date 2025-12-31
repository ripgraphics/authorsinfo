/**
 * Performance Monitoring Dashboard API
 * 
 * Provides real-time performance metrics, alerts, and analytics
 * Endpoint: GET /api/admin/performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/performance-monitor'

/**
 * GET /api/admin/performance
 * Returns current performance metrics and alerts
 * 
 * Query parameters:
 * - metrics=true: Include detailed query metrics
 * - alerts=true: Include recent alerts
 * - summary=true: Include performance summary (default)
 * - db=true: Include database metrics
 * - seconds=60: Time window for summary (default 60)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeMetrics = searchParams.get('metrics') === 'true'
    const includeAlerts = searchParams.get('alerts') === 'true'
    const includeSummary = searchParams.get('summary') !== 'false' // default true
    const includeDb = searchParams.get('db') === 'true'
    const secondsBack = parseInt(searchParams.get('seconds') || '60')

    const response: any = {
      timestamp: new Date().toISOString(),
      status: 'ok',
    }

    // Add performance summary
    if (includeSummary) {
      const summary = performanceMonitor.getPerformanceSummary(secondsBack)
      response.summary = {
        timeWindow: `${secondsBack}s`,
        ...summary,
        successRate: summary.totalQueries > 0 
          ? ((summary.successfulQueries / summary.totalQueries) * 100).toFixed(2) + '%'
          : 'N/A',
      }
    }

    // Add detailed query metrics
    if (includeMetrics) {
      // Get metrics from last N minutes
      const allMetrics = performanceMonitor.exportMetrics().queryMetrics
      const recentMetrics = allMetrics.filter(
        m => m.timestamp > new Date(Date.now() - secondsBack * 1000)
      )
      
      // Group by query name
      const byQuery: Record<string, any> = {}
      recentMetrics.forEach(metric => {
        if (!byQuery[metric.name]) {
          byQuery[metric.name] = {
            count: 0,
            totalTime: 0,
            minTime: Infinity,
            maxTime: 0,
            errors: 0,
          }
        }
        byQuery[metric.name].count++
        byQuery[metric.name].totalTime += metric.duration
        byQuery[metric.name].minTime = Math.min(byQuery[metric.name].minTime, metric.duration)
        byQuery[metric.name].maxTime = Math.max(byQuery[metric.name].maxTime, metric.duration)
        if (metric.status === 'error') byQuery[metric.name].errors++
      })

      // Calculate averages
      Object.keys(byQuery).forEach(queryName => {
        const stats = byQuery[queryName]
        stats.avgTime = (stats.totalTime / stats.count).toFixed(2)
        stats.errorRate = ((stats.errors / stats.count) * 100).toFixed(2) + '%'
        delete stats.totalTime
        delete stats.minTime
        delete stats.maxTime
      })

      response.queryMetrics = byQuery
    }

    // Add recent alerts
    if (includeAlerts) {
      const alerts = performanceMonitor.getRecentAlerts(20)
      response.alerts = {
        total: alerts.length,
        recent: alerts.map(a => ({
          type: a.type,
          message: a.message,
          timestamp: a.timestamp.toISOString(),
          threshold: a.threshold,
          currentValue: a.currentValue,
        })),
        criticalCount: alerts.filter(a => a.type === 'critical').length,
        warningCount: alerts.filter(a => a.type === 'warning').length,
      }
    }

    // Add database metrics
    if (includeDb) {
      const dbMetric = performanceMonitor.getLatestDatabaseMetrics()
      if (dbMetric) {
        response.database = {
          timestamp: dbMetric.timestamp.toISOString(),
          activeConnections: `${dbMetric.activeConnections}%`,
          queriesPerSecond: dbMetric.queriesPerSecond.toFixed(2),
          averageQueryTime: `${dbMetric.averageQueryTime.toFixed(2)}ms`,
          slowQueries: dbMetric.slowQueries,
          cacheHitRate: `${(dbMetric.cacheHitRate * 100).toFixed(1)}%`,
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}
