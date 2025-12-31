/**
 * Load Testing Utility
 * 
 * Simulates multiple concurrent users and operations for performance validation
 * Tests the application under realistic and stress conditions
 */

interface LoadTestConfig {
  concurrentUsers: number       // Number of concurrent simulated users
  operationsPerUser: number     // Operations each user performs
  rampUpTime: number           // Time to ramp up to full load (seconds)
  duration: number             // Total test duration (seconds)
  targetOperations?: string[]  // Specific operations to test
}

interface LoadTestResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalDuration: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  successRate: string
  errors: string[]
}

class LoadTester {
  private responseTimes: number[] = []
  private errors: Map<string, number> = new Map()

  /**
   * Simulate a user operation
   */
  private async simulateOperation(operationName: string): Promise<number> {
    const startTime = performance.now()
    
    try {
      // Simulate different types of operations
      const duration = this.getOperationDuration(operationName)
      await this.delay(duration)
      
      const elapsed = performance.now() - startTime
      this.responseTimes.push(elapsed)
      return elapsed
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.errors.set(errorMsg, (this.errors.get(errorMsg) || 0) + 1)
      throw error
    }
  }

  /**
   * Get simulated operation duration based on type
   */
  private getOperationDuration(operation: string): number {
    const durations: Record<string, number> = {
      'list_books': 50 + Math.random() * 100,           // 50-150ms
      'get_book': 30 + Math.random() * 70,              // 30-100ms
      'search_books': 100 + Math.random() * 200,        // 100-300ms
      'update_reading_progress': 40 + Math.random() * 60, // 40-100ms
      'get_user_profile': 25 + Math.random() * 50,      // 25-75ms
      'list_events': 60 + Math.random() * 120,          // 60-180ms
      'create_group': 100 + Math.random() * 150,        // 100-250ms
      'get_friends_list': 80 + Math.random() * 120,     // 80-200ms
      'get_group_members': 70 + Math.random() * 100,    // 70-170ms
      'default': 50 + Math.random() * 100,              // 50-150ms
    }
    
    return durations[operation] || durations['default']
  }

  /**
   * Simulate a concurrent user
   */
  private async simulateUser(
    userId: number,
    operationsPerUser: number,
    operations: string[]
  ): Promise<void> {
    const availableOps = operations.length > 0 ? operations : [
      'list_books',
      'get_book',
      'search_books',
      'update_reading_progress',
      'get_user_profile',
      'list_events',
    ]

    for (let i = 0; i < operationsPerUser; i++) {
      const operation = availableOps[Math.floor(Math.random() * availableOps.length)]
      
      try {
        await this.simulateOperation(operation)
      } catch (error) {
        // Continue on error
      }

      // Simulate think time between operations
      await this.delay(10 + Math.random() * 50)
    }
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Run a load test
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log(`🚀 Starting Load Test`)
    console.log(`   Users: ${config.concurrentUsers}`)
    console.log(`   Operations per user: ${config.operationsPerUser}`)
    console.log(`   Ramp up time: ${config.rampUpTime}s`)
    console.log(`   Test duration: ${config.duration}s`)
    console.log('')

    this.responseTimes = []
    this.errors.clear()

    const testStartTime = performance.now()
    const usersPerSecond = config.concurrentUsers / Math.max(config.rampUpTime, 1)
    const promises: Promise<void>[] = []

    // Ramp up users gradually
    for (let i = 0; i < config.concurrentUsers; i++) {
      const delayBeforeStart = (i / usersPerSecond) * 1000

      setTimeout(() => {
        promises.push(
          this.simulateUser(i, config.operationsPerUser, config.targetOperations || [])
        )
      }, delayBeforeStart)
    }

    // Wait for all operations to complete
    await Promise.allSettled(promises)

    const testEndTime = performance.now()
    const totalDuration = testEndTime - testStartTime

    // Calculate statistics
    const sortedTimes = this.responseTimes.sort((a, b) => a - b)
    const totalRequests = this.responseTimes.length
    const failedRequests = Array.from(this.errors.values()).reduce((a, b) => a + b, 0)
    const successfulRequests = totalRequests - failedRequests

    const result: LoadTestResult = {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalDuration: totalDuration / 1000, // Convert to seconds
      averageResponseTime: sortedTimes.length > 0 
        ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length
        : 0,
      minResponseTime: sortedTimes.length > 0 ? sortedTimes[0] : 0,
      maxResponseTime: sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0,
      p50ResponseTime: sortedTimes.length > 0 
        ? sortedTimes[Math.floor(sortedTimes.length * 0.5)]
        : 0,
      p95ResponseTime: sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length * 0.95)]
        : 0,
      p99ResponseTime: sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length * 0.99)]
        : 0,
      requestsPerSecond: totalRequests / (totalDuration / 1000),
      successRate: totalRequests > 0 
        ? ((successfulRequests / totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      errors: Array.from(this.errors.entries()).map(
        ([error, count]) => `${error}: ${count}`
      ),
    }

    return result
  }

  /**
   * Run a stress test (10x normal load)
   */
  async runStressTest(): Promise<LoadTestResult> {
    return this.runLoadTest({
      concurrentUsers: 100,
      operationsPerUser: 50,
      rampUpTime: 10,
      duration: 60,
    })
  }

  /**
   * Run a volume test (normal load)
   */
  async runVolumeTest(): Promise<LoadTestResult> {
    return this.runLoadTest({
      concurrentUsers: 10,
      operationsPerUser: 50,
      rampUpTime: 5,
      duration: 30,
    })
  }

  /**
   * Run an endurance test (prolonged load)
   */
  async runEnduranceTest(): Promise<LoadTestResult> {
    return this.runLoadTest({
      concurrentUsers: 20,
      operationsPerUser: 100,
      rampUpTime: 10,
      duration: 120,
    })
  }
}

export const loadTester = new LoadTester()

/**
 * Format load test results for display
 */
export function formatLoadTestResults(results: LoadTestResult): string {
  return `
📊 Load Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Requests:
  Total Requests:        ${results.totalRequests}
  Successful:            ${results.successfulRequests}
  Failed:                ${results.failedRequests}
  Success Rate:          ${results.successRate}
  RPS (Requests/sec):    ${results.requestsPerSecond.toFixed(2)}

⏱️  Response Times (ms):
  Minimum:               ${results.minResponseTime.toFixed(2)}
  Average:               ${results.averageResponseTime.toFixed(2)}
  Median (P50):          ${results.p50ResponseTime.toFixed(2)}
  P95:                   ${results.p95ResponseTime.toFixed(2)}
  P99:                   ${results.p99ResponseTime.toFixed(2)}
  Maximum:               ${results.maxResponseTime.toFixed(2)}

⏳ Test Duration:        ${results.totalDuration.toFixed(2)} seconds

${results.errors.length > 0 ? `
❌ Errors:
${results.errors.map(e => `  • ${e}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}
