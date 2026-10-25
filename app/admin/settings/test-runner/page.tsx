'use client'

import React from 'react'
import { useState, useTransition, useEffect } from 'react'
import { Play, RotateCcw, CheckCircle2, XCircle, Loader2, Circle, FlaskConical, LayoutGrid, List, GitBranch } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminAuthCheck } from '@/components/admin/auth-check'
import { cn } from '@/lib/utils'
import {
  runE2ETest,
  runAllE2ETests,
  getTestDefinitions,
  type TestCase,
  type TestSuiteResult,
  type TestStatus,
} from '@/app/actions/run-e2e-test'

type ViewMode = 'grid' | 'table' | 'pipeline'

function StatusBadge({ status }: { status: TestStatus }) {
  const config = {
    idle: { variant: 'outline' as const, label: 'Idle' },
    running: { variant: 'default' as const, label: 'Running' },
    passed: { variant: 'success' as const, label: 'Passed' },
    failed: { variant: 'destructive' as const, label: 'Failed' },
    error: { variant: 'destructive' as const, label: 'Error' },
  }
  const { variant, label } = config[status]
  return (
    <Badge variant={variant} className={cn(status === 'running' && 'animate-pulse')}>
      {label}
    </Badge>
  )
}

function TestCard({
  test,
  onRun,
}: {
  test: TestCase
  onRun: (id: string) => void
}) {
  const isFailed = test.status === 'failed' || test.status === 'error'
  return (
    <Card className={cn('overflow-hidden transition-colors', isFailed && 'border-destructive/50')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-muted-foreground">{test.category}</h4>
          <StatusBadge status={test.status} />
        </div>
        <p className="text-base font-semibold mb-1">{test.name}</p>
        <p className="text-xs text-muted-foreground mb-4">{test.description}</p>

        {test.error && (
          <div className="mb-4 bg-destructive/5 border border-destructive/20 rounded p-3">
            <pre className="text-xs text-destructive-foreground font-mono whitespace-pre-wrap break-all">
              {test.error}
            </pre>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {test.duration
              ? `Last run: ${test.lastRun} · ${test.duration}`
              : test.lastRun
                ? `Last run: ${test.lastRun}`
                : 'Not yet run'}
          </span>
          <Button
            variant="default"
            size="sm"
            disabled={test.status === 'running'}
            onClick={() => onRun(test.id)}
          >
            {test.status === 'running' ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : test.status === 'failed' ? (
              <RotateCcw className="w-3 h-3 mr-1" />
            ) : (
              <Play className="w-3 h-3 mr-1" />
            )}
            {test.status === 'failed' ? 'Retry' : test.status === 'running' ? 'Running...' : 'Run'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TestTable({ tests, onRun }: { tests: TestCase[]; onRun: (id: string) => void }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left p-3 font-medium text-muted-foreground w-8">#</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Test Name</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Duration</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tests.map((test, idx) => (
            <React.Fragment key={test.id}>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-3 text-muted-foreground">{idx + 1}</td>
                <td className="p-3 font-medium">{test.name}</td>
                <td className="p-3"><Badge variant="outline">{test.category}</Badge></td>
                <td className="p-3"><StatusBadge status={test.status} /></td>
                <td className="p-3 text-muted-foreground">{test.duration || '—'}</td>
                <td className="p-3 text-right">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={test.status === 'running'}
                    onClick={() => onRun(test.id)}
                  >
                    {test.status === 'running' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : test.status === 'failed' ? (
                      <RotateCcw className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                </td>
              </tr>
              {test.error && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <div className="px-3 py-2 ml-8 border-l-2 border-destructive/50 bg-destructive/5">
                      <pre className="text-xs text-destructive-foreground font-mono whitespace-pre-wrap break-all">
                        {test.error}
                      </pre>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TestPipeline({ tests, onRun }: { tests: TestCase[]; onRun: (id: string) => void }) {
  return (
    <div className="space-y-4">
      {tests.map((test, idx) => (
        <div key={test.id} className="relative">
          {idx < tests.length - 1 && (
            <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
          )}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2',
                test.status === 'passed' ? 'border-green-500 bg-green-500/10' :
                test.status === 'failed' ? 'border-red-500 bg-red-500/10' :
                test.status === 'running' ? 'border-blue-500 bg-blue-500/10' :
                'border-muted bg-muted'
              )}>
                {test.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {test.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                {test.status === 'running' && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                {test.status === 'idle' && <Circle className="w-5 h-5 text-muted-foreground" />}
              </div>
            </div>
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{test.name}</h4>
                  <StatusBadge status={test.status} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{test.description}</p>
                {test.error && (
                  <div className="mb-3 bg-destructive/5 border border-destructive/20 rounded p-3">
                    <pre className="text-xs text-destructive-foreground font-mono whitespace-pre-wrap break-all">
                      {test.error}
                    </pre>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-xs text-muted-foreground">
                    {test.duration ? `${test.duration}` : '—'}
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={test.status === 'running'}
                    onClick={() => onRun(test.id)}
                  >
                    {test.status === 'running' ? 'Running...' : test.status === 'failed' ? 'Retry' : 'Run'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  )
}

function TestRunnerContent() {
  const [tests, setTests] = useState<TestCase[]>([])
  const [summary, setSummary] = useState('Loading tests...')
  const [isPending, startTransition] = useTransition()
  const [initialized, setInitialized] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [runningTestId, setRunningTestId] = useState<string | null>(null)

  useEffect(() => {
    if (initialized) return
    startTransition(async () => {
      const result = await getTestDefinitions()
      setTests(result.tests)
      setSummary(`${result.tests.length} tests available`)
      setInitialized(true)
    })
  }, [initialized, startTransition])

  const handleRunSingle = async (testId: string) => {
    setRunningTestId(testId)
    try {
      const result = await runE2ETest(testId)
      setTests((prev) => prev.map((t) => (t.id === testId ? result : t)))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                status: 'error' as TestStatus,
                lastRun: new Date().toLocaleTimeString(),
                error: message.slice(0, 500),
              }
            : t
        )
      )
    } finally {
      setRunningTestId(null)
    }
  }

  const handleRunAll = () => {
    startTransition(async () => {
      setTests((prev) => prev.map((t) => ({ ...t, status: 'running' as TestStatus })))
      try {
        const result = await runAllE2ETests()
        setTests(result.tests)
        setSummary(result.summary)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setTests((prev) =>
          prev.map((t) => ({
            ...t,
            status: 'error' as TestStatus,
            lastRun: new Date().toLocaleTimeString(),
            error: message.slice(0, 500),
          }))
        )
      }
    })
  }

  const passedCount = tests.filter((t) => t.status === 'passed').length
  const failedCount = tests.filter((t) => t.status === 'failed' || t.status === 'error').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FlaskConical className="w-6 h-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">E2E Test Runner</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Production tests running against authorsinfo.com
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tests.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              {passedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  {passedCount} passed
                </span>
              )}
              {failedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-red-500">
                  <XCircle className="w-4 h-4" />
                  {failedCount} failed
                </span>
              )}
            </div>
          )}
          <Button onClick={handleRunAll} disabled={runningTestId !== null || isPending}>
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : runningTestId ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run All Tests
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Chat E2E Tests</CardTitle>
          <CardDescription>{summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <List className="w-4 h-4" />
                Table
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="gap-2">
                <GitBranch className="w-4 h-4" />
                Pipeline
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tests.map((test) => (
                  <TestCard key={test.id} test={test} onRun={handleRunSingle} />
                ))}
              </div>
            )}
            {viewMode === 'table' && (
              <TestTable tests={tests} onRun={handleRunSingle} />
            )}
            {viewMode === 'pipeline' && (
              <TestPipeline tests={tests} onRun={handleRunSingle} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestRunnerPage() {
  return (
    <AdminAuthCheck>
      <TestRunnerContent />
    </AdminAuthCheck>
  )
}
