/**
 * Performance Monitoring Service
 * 
 * Real-time database query and application performance tracking
 * Tracks query execution time, database load, and system metrics
 */

interface QueryMetric {
  name: string
  duration: number // milliseconds
  timestamp: Date
  status: 'success' | 'error'
  rowsAffected?: number
  errorMessage?: string
}

interface DatabaseMetric {
  timestamp: Date
  activeConnections: number
  queriesPerSecond: number
  averageQueryTime: number
  slowQueries: number
  cacheHitRate: number
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'critical'
  message: string
  threshold: number
  currentValue: number
  timestamp: Date
}

class PerformanceMonitor {
  private queryMetrics: QueryMetric[] = []
  private dbMetrics: DatabaseMetric[] = []
  private alerts: PerformanceAlert[] = []
  
  // Configuration thresholds
  private thresholds = {
    slowQueryMs: 1000,           // Query > 1 second is slow
    maxQueriesPerSecond: 100,    // Alert if exceeds
    maxAverageQueryTime: 500,    // Alert if exceeds
    slowQueryCount: 5,           // Alert if more than 5 slow queries
    cacheHitRateThreshold: 0.7,  // Alert if below 70%
    activeConnectionsWarning: 80,
    activeConnectionsCritical: 95,
  }

  /**
   * Record a query metric
   */
  recordQuery(
    name: string,
    duration: number,
    status: 'success' | 'error' = 'success',
    rowsAffected?: number,
    errorMessage?: string
  ): void {
    const metric: QueryMetric = {
      name,
      duration,
      timestamp: new Date(),
      status,
      rowsAffected,
      errorMessage,
    }

    this.queryMetrics.push(metric)

    // Keep only last 1000 metrics in memory
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000)
    }

    // Check for slow queries
    if (duration > this.thresholds.slowQueryMs) {
      this.createAlert(
        'warning',
        `Slow query detected: ${name} took ${duration}ms`,
        this.thresholds.slowQueryMs,
        duration
      )
    }
  }

  /**
   * Record database metrics
   */
  recordDatabaseMetrics(metrics: Omit<DatabaseMetric, 'timestamp'>): void {
    const dbMetric: DatabaseMetric = {
      ...metrics,
      timestamp: new Date(),
    }

    this.dbMetrics.push(dbMetric)

    // Keep only last 100 metrics (approximately last 5 minutes at 20-second intervals)
    if (this.dbMetrics.length > 100) {
      this.dbMetrics = this.dbMetrics.slice(-100)
    }

    // Check thresholds
    this.validateDatabaseMetrics(dbMetric)
  }

  /**
   * Validate database metrics against thresholds
   */
  private validateDatabaseMetrics(metric: DatabaseMetric): void {
    if (metric.queriesPerSecond > this.thresholds.maxQueriesPerSecond) {
      this.createAlert(
        'critical',
        `High query rate: ${metric.queriesPerSecond.toFixed(2)} QPS`,
        this.thresholds.maxQueriesPerSecond,
        metric.queriesPerSecond
      )
    }

    if (metric.averageQueryTime > this.thresholds.maxAverageQueryTime) {
      this.createAlert(
        'warning',
        `High average query time: ${metric.averageQueryTime.toFixed(2)}ms`,
        this.thresholds.maxAverageQueryTime,
        metric.averageQueryTime
      )
    }

    if (metric.slowQueries > this.thresholds.slowQueryCount) {
      this.createAlert(
        'warning',
        `Multiple slow queries detected: ${metric.slowQueries}`,
        this.thresholds.slowQueryCount,
        metric.slowQueries
      )
    }

    if (metric.cacheHitRate < this.thresholds.cacheHitRateThreshold) {
      this.createAlert(
        'warning',
        `Low cache hit rate: ${(metric.cacheHitRate * 100).toFixed(1)}%`,
        this.thresholds.cacheHitRateThreshold,
        metric.cacheHitRate
      )
    }

    if (metric.activeConnections > this.thresholds.activeConnectionsCritical) {
      this.createAlert(
        'critical',
        `Critical connection pool usage: ${metric.activeConnections}%`,
        this.thresholds.activeConnectionsCritical,
        metric.activeConnections
      )
    } else if (metric.activeConnections > this.thresholds.activeConnectionsWarning) {
      this.createAlert(
        'warning',
        `High connection pool usage: ${metric.activeConnections}%`,
        this.thresholds.activeConnectionsWarning,
        metric.activeConnections
      )
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(
    type: 'warning' | 'critical',
    message: string,
    threshold: number,
    currentValue: number
  ): void {
    const alert: PerformanceAlert = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      threshold,
      currentValue,
      timestamp: new Date(),
    }

    this.alerts.push(alert)

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    // Log critical alerts
    if (type === 'critical') {
      console.error(`🚨 CRITICAL: ${message}`)
    } else {
      console.warn(`⚠️ WARNING: ${message}`)
    }
  }

  /**
   * Get performance summary for last N seconds
   */
  getPerformanceSummary(secondsBack: number = 60): {
    totalQueries: number
    successfulQueries: number
    failedQueries: number
    averageQueryTime: number
    slowQueryCount: number
    p50Time: number
    p95Time: number
    p99Time: number
  } {
    const cutoffTime = new Date(Date.now() - secondsBack * 1000)
    const recentQueries = this.queryMetrics.filter(q => q.timestamp > cutoffTime)

    if (recentQueries.length === 0) {
      return {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        averageQueryTime: 0,
        slowQueryCount: 0,
        p50Time: 0,
        p95Time: 0,
        p99Time: 0,
      }
    }

    const durations = recentQueries.map(q => q.duration).sort((a, b) => a - b)
    const totalTime = durations.reduce((a, b) => a + b, 0)

    return {
      totalQueries: recentQueries.length,
      successfulQueries: recentQueries.filter(q => q.status === 'success').length,
      failedQueries: recentQueries.filter(q => q.status === 'error').length,
      averageQueryTime: totalTime / recentQueries.length,
      slowQueryCount: recentQueries.filter(q => q.duration > this.thresholds.slowQueryMs).length,
      p50Time: durations[Math.floor(durations.length * 0.5)],
      p95Time: durations[Math.floor(durations.length * 0.95)],
      p99Time: durations[Math.floor(durations.length * 0.99)],
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): PerformanceAlert[] {
    return this.alerts.slice(-limit)
  }

  /**
   * Get latest database metrics
   */
  getLatestDatabaseMetrics(): DatabaseMetric | null {
    return this.dbMetrics.length > 0 ? this.dbMetrics[this.dbMetrics.length - 1] : null
  }

  /**
   * Get query metrics for a specific query
   */
  getQueryMetrics(queryName: string): QueryMetric[] {
    return this.queryMetrics.filter(q => q.name === queryName)
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    queryMetrics: QueryMetric[]
    databaseMetrics: DatabaseMetric[]
    alerts: PerformanceAlert[]
    summary: ReturnType<typeof this.getPerformanceSummary>
  } {
    return {
      queryMetrics: [...this.queryMetrics],
      databaseMetrics: [...this.dbMetrics],
      alerts: [...this.alerts],
      summary: this.getPerformanceSummary(),
    }
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.queryMetrics = []
    this.dbMetrics = []
    this.alerts = []
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Wrapper to track query performance
 */
export async function trackQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await queryFn()
    const duration = performance.now() - startTime
    
    performanceMonitor.recordQuery(queryName, duration, 'success')
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    performanceMonitor.recordQuery(
      queryName,
      duration,
      'error',
      undefined,
      error instanceof Error ? error.message : String(error)
    )
    
    throw error
  }
}

/**
 * Decorator for tracking function performance
 */
export function trackPerformance(queryName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const name = queryName || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return trackQueryPerformance(name, () => originalMethod.apply(this, args))
    }

    return descriptor
  }
}
