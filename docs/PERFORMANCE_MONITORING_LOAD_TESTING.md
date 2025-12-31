# Performance Monitoring & Load Testing Guide
**Phase:** Week 4-6 Phase 2 & 3 - Optional Enhancement  
**Date:** December 25, 2025  
**Status:** Ready to Execute

---

## 📊 Table of Contents

1. [Performance Monitoring](#performance-monitoring)
2. [Load Testing](#load-testing)
3. [Implementation Guide](#implementation-guide)
4. [Interpreting Results](#interpreting-results)
5. [Production Deployment](#production-deployment)

---

## 🔍 Performance Monitoring

### Overview

The performance monitoring system provides real-time tracking of:
- **Query Performance:** Individual query execution times and patterns
- **Database Metrics:** Connection pool usage, cache hit rates, query throughput
- **System Alerts:** Automatic alerting on performance thresholds
- **Historical Data:** Metrics stored for trend analysis

### Features

#### 1. Query Performance Tracking
```typescript
// Automatic tracking of all database queries
- Query name and duration
- Success/failure status
- Row count affected
- Error messages

// Threshold alerts:
- Slow query alert (> 1000ms)
- High query rate alert (> 100 QPS)
- High average query time (> 500ms)
- Multiple slow queries (> 5 in time window)
```

#### 2. Database Metrics
```typescript
// Tracked metrics:
- Active connections (% of pool)
- Queries per second (QPS)
- Average query time
- Count of slow queries
- Cache hit rate

// Alert thresholds:
- Connection pool warning (> 80%)
- Connection pool critical (> 95%)
- Cache hit rate warning (< 70%)
```

#### 3. Performance Alerts
```typescript
// Alert types:
- ⚠️  WARNING: Performance degradation detected
- 🚨 CRITICAL: Immediate action required

// Alert triggers:
- Slow query detected
- High database load
- Connection pool exhaustion
- Low cache performance
```

### API Endpoints

#### GET `/api/admin/performance`

Returns current performance metrics with various query parameters.

**Query Parameters:**
- `metrics=true` - Include detailed query metrics by operation
- `alerts=true` - Include recent alert log
- `db=true` - Include database metrics
- `seconds=60` - Time window for summary (default 60 seconds)

**Examples:**

```bash
# Get performance summary (default)
curl http://localhost:3000/api/admin/performance

# Get detailed metrics with alerts
curl http://localhost:3000/api/admin/performance?metrics=true&alerts=true&db=true

# Get metrics for last 5 minutes
curl http://localhost:3000/api/admin/performance?seconds=300

# Combined query
curl http://localhost:3000/api/admin/performance?metrics=true&alerts=true&db=true&seconds=300
```

**Response Example:**
```json
{
  "timestamp": "2025-12-25T15:30:45.123Z",
  "status": "ok",
  "summary": {
    "timeWindow": "60s",
    "totalQueries": 1250,
    "successfulQueries": 1248,
    "failedQueries": 2,
    "averageQueryTime": 45.3,
    "slowQueryCount": 3,
    "p50Time": 35.2,
    "p95Time": 120.5,
    "p99Time": 250.8,
    "successRate": "99.84%"
  },
  "queryMetrics": {
    "getPublicEvents": {
      "count": 145,
      "avgTime": "52.3",
      "errorRate": "0.00%"
    },
    "getEventById": {
      "count": 89,
      "avgTime": "38.5",
      "errorRate": "2.25%"
    }
  },
  "alerts": {
    "total": 2,
    "criticalCount": 0,
    "warningCount": 2,
    "recent": [
      {
        "type": "warning",
        "message": "High average query time: 520.30ms",
        "threshold": 500,
        "currentValue": 520.3,
        "timestamp": "2025-12-25T15:30:40.123Z"
      }
    ]
  },
  "database": {
    "timestamp": "2025-12-25T15:30:45.123Z",
    "activeConnections": "45%",
    "queriesPerSecond": "20.83",
    "averageQueryTime": "45.30ms",
    "slowQueries": 3,
    "cacheHitRate": "87.5%"
  }
}
```

---

## 🧪 Load Testing

### Overview

The load testing framework simulates realistic user behavior to validate performance under various conditions.

### Test Types

#### 1. Volume Test (Normal Load)
```
Configuration:
- Concurrent Users: 10
- Operations per User: 50
- Ramp-up Time: 5 seconds
- Duration: 30 seconds

Purpose:
- Baseline performance validation
- Typical daily usage patterns
- Basic regression testing
```

#### 2. Stress Test (10x Load)
```
Configuration:
- Concurrent Users: 100
- Operations per User: 50
- Ramp-up Time: 10 seconds
- Duration: 60 seconds

Purpose:
- Peak load handling
- Identifies bottlenecks
- Validates scalability
```

#### 3. Endurance Test (Prolonged Load)
```
Configuration:
- Concurrent Users: 20
- Operations per User: 100
- Ramp-up Time: 10 seconds
- Duration: 120 seconds

Purpose:
- Memory leak detection
- Connection pool stability
- Cache performance over time
```

### Simulated Operations

Each test includes realistic operations:
- `list_books` - Browse book listings (50-150ms)
- `get_book` - Get single book details (30-100ms)
- `search_books` - Search functionality (100-300ms)
- `update_reading_progress` - Track reading (40-100ms)
- `get_user_profile` - User profile lookup (25-75ms)
- `list_events` - Event browsing (60-180ms)
- `create_group` - Group creation (100-250ms)
- `get_friends_list` - Friends lookup (80-200ms)
- `get_group_members` - Member browsing (70-170ms)

### Running Load Tests

```typescript
import { loadTester, formatLoadTestResults } from '@/lib/load-tester'

// Volume test
const volumeResults = await loadTester.runVolumeTest()
console.log(formatLoadTestResults(volumeResults))

// Stress test
const stressResults = await loadTester.runStressTest()
console.log(formatLoadTestResults(stressResults))

// Endurance test
const enduranceResults = await loadTester.runEnduranceTest()
console.log(formatLoadTestResults(enduranceResults))

// Custom test
const customResults = await loadTester.runLoadTest({
  concurrentUsers: 50,
  operationsPerUser: 100,
  rampUpTime: 15,
  duration: 120,
  targetOperations: ['search_books', 'get_book', 'list_events']
})
```

---

## 📋 Implementation Guide

### Step 1: Add Performance Tracking to Key Operations

```typescript
// In your API routes or server actions:
import { trackQueryPerformance } from '@/lib/performance-monitor'

export async function getEvents() {
  return trackQueryPerformance('getPublicEvents', async () => {
    const { data } = await supabase
      .from('events')
      .select('id, title, start_date')
      .limit(20)
    
    return data
  })
}
```

### Step 2: Record Database Metrics Periodically

```typescript
// In a scheduled job or middleware:
import { performanceMonitor } from '@/lib/performance-monitor'

// Every 20 seconds, record database metrics
setInterval(() => {
  performanceMonitor.recordDatabaseMetrics({
    activeConnections: getActiveConnections(),     // 0-100%
    queriesPerSecond: getQueriesPerSecond(),
    averageQueryTime: getAverageQueryTime(),
    slowQueries: countSlowQueries(),
    cacheHitRate: calculateCacheHitRate(),         // 0-1
  })
}, 20000)
```

### Step 3: Monitor the Dashboard

```bash
# Real-time monitoring
watch -n 1 'curl http://localhost:3000/api/admin/performance?metrics=true&alerts=true'

# Or in your admin dashboard, fetch and display:
GET /api/admin/performance?metrics=true&alerts=true&db=true
```

### Step 4: Run Load Tests

```bash
# In Node.js script or test suite:
node -e "
const { loadTester, formatLoadTestResults } = require('./lib/load-tester');

(async () => {
  console.log('Running volume test...');
  const results = await loadTester.runVolumeTest();
  console.log(formatLoadTestResults(results));
})()
"
```

---

## 📈 Interpreting Results

### Performance Benchmarks (Post-Optimization)

Based on Phase 2 + Phase 1 optimizations, expect:

**Query Performance:**
- Average query time: 40-60ms
- P95 query time: 100-150ms
- P99 query time: 200-300ms
- Slow queries (>1000ms): < 1%

**Database Metrics:**
- Cache hit rate: > 85%
- Active connections: < 60% of pool
- Queries per second: 20-50 QPS under normal load
- Average query time: 40-50ms

**Success Rates:**
- Normal load: > 99.5%
- Stress test: > 98%
- Endurance test: Stable over 2+ minutes

### Alert Interpretation

| Alert | Meaning | Action |
|-------|---------|--------|
| Slow query detected | Query exceeded 1s | Review query, add index |
| High query rate | > 100 QPS | Scale database resources |
| High avg query time | > 500ms | Investigate slow queries |
| Low cache hit rate | < 70% | Review cache strategy |
| Connection pool warning | > 80% active | Increase connection pool |
| Connection pool critical | > 95% active | URGENT: Scale immediately |

### Load Test Interpretation

**Volume Test (10 concurrent users):**
- Expected RPS: 15-25
- Expected avg response: 50-80ms
- Expected success rate: > 99%

**Stress Test (100 concurrent users):**
- Expected RPS: 100-150
- Expected avg response: 80-120ms
- Expected success rate: > 98%

**Endurance Test (20 concurrent users, 2 minutes):**
- Should maintain consistent performance
- No memory leaks (process memory stable)
- Connection pool should stabilize

---

## 🚀 Production Deployment

### Before Going Live

1. **Run Baseline Tests**
   ```bash
   npm run test:load:volume    # Normal load
   npm run test:load:stress    # Peak load
   npm run test:load:endurance # Stability
   ```

2. **Check Performance Metrics**
   - Visit `/api/admin/performance?metrics=true&alerts=true`
   - Verify no critical alerts
   - Review response time percentiles

3. **Monitor for 24 Hours**
   - Set up continuous performance monitoring
   - Watch for unusual patterns
   - Alert on threshold breaches

### Monitoring Strategy

**Real-Time (Every 5 minutes):**
- Total queries, success rate
- Average response time
- Critical alerts

**Hourly:**
- Performance trends
- Slow query patterns
- Resource utilization

**Daily:**
- Performance summary
- Peak hour metrics
- Optimization opportunities

### Optimization Tips

If tests reveal issues:

1. **Slow Queries:**
   - Review query plans with `EXPLAIN`
   - Add missing database indexes
   - Consider query refactoring

2. **High Load:**
   - Increase database resources
   - Implement caching strategies
   - Add read replicas for reads

3. **Connection Pool Exhaustion:**
   - Increase `max_connections` setting
   - Reduce long-running operations
   - Implement connection pooling

4. **Low Cache Performance:**
   - Review cache invalidation strategy
   - Adjust cache TTLs
   - Monitor cache key distribution

---

## 📚 Additional Resources

- **Performance Monitor:** `lib/performance-monitor.ts`
- **Load Tester:** `lib/load-tester.ts`
- **API Endpoint:** `app/api/admin/performance/route.ts`
- **Phase 1 Audit:** `docs/WEEK_4_6_DATA_OPTIMIZATION_AUDIT.md`
- **Phase 1 Completion:** `docs/WEEK_4_6_PHASE_1_COMPLETION.md`

---

**Status:** Ready to Execute - Estimated Time: 1-2 hours
