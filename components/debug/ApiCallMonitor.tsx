'use client'

import { useState, useEffect } from 'react'
import { getCacheStats } from '@/lib/request-utils'

export function ApiCallMonitor() {
  const [stats, setStats] = useState(getCacheStats())
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 z-50"
        title="Show API Monitor"
      >
        📊
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">API Call Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Cache Size:</span>
          <span className="font-mono">{stats.cacheSize}</span>
        </div>
        <div className="flex justify-between">
          <span>Active Requests:</span>
          <span className="font-mono">{stats.activeRequests}</span>
        </div>
        
        {stats.cacheKeys.length > 0 && (
          <div>
            <span className="font-semibold">Cached Keys:</span>
            <div className="mt-1 space-y-1">
              {stats.cacheKeys.slice(0, 3).map((key, i) => (
                <div key={i} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {key}
                </div>
              ))}
              {stats.cacheKeys.length > 3 && (
                <div className="text-xs text-gray-500">
                  ...and {stats.cacheKeys.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
        
        {stats.activeRequestKeys.length > 0 && (
          <div>
            <span className="font-semibold">Active Requests:</span>
            <div className="mt-1 space-y-1">
              {stats.activeRequestKeys.slice(0, 3).map((key, i) => (
                <div key={i} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {key}
                </div>
              ))}
              {stats.activeRequestKeys.length > 3 && (
                <div className="text-xs text-gray-500">
                  ...and {stats.activeRequestKeys.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
