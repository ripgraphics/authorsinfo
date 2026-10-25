'use server'

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'

const execFileAsync = promisify(execFile)

export type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'error'

export interface TestCase {
  id: string
  name: string
  category: string
  description: string
  grepPattern: string
  status: TestStatus
  duration: string | null
  lastRun: string | null
  error: string | null
}

export interface TestSuiteResult {
  tests: TestCase[]
  overallStatus: 'idle' | 'running' | 'passed' | 'failed'
  summary: string
}

const PROJECT_ROOT = path.resolve(/*turbopackIgnore: true*/ process.cwd())

const TEST_DEFINITIONS: Omit<TestCase, 'status' | 'duration' | 'lastRun' | 'error'>[] = [
  {
    id: 'auth-read-send',
    name: 'Active member can read and send',
    category: 'Authorization',
    description: 'Verifies active members get 200/201 while nonmembers and suspended users get 403.',
    grepPattern: 'active member can read',
  },
  {
    id: 'member-removal',
    name: 'Removed member loses access',
    category: 'Membership',
    description: 'Confirms removed members receive 403 on history, channel read, and send attempts.',
    grepPattern: 'removed member loses',
  },
  {
    id: 'security-forged',
    name: 'Rejects forged sender payloads',
    category: 'Security',
    description: 'Attempts to send a message with a spoofed user_id; expects 400 response.',
    grepPattern: 'rejects event channels',
  },
  {
    id: 'realtime-delivery',
    name: 'Realtime delivery to subscriber',
    category: 'Realtime',
    description: 'Sends via API, expects postgres_changes INSERT event on observer channel within 15s.',
    grepPattern: 'delivers a group message',
  },
]

function createIdleTests(): TestCase[] {
  return TEST_DEFINITIONS.map((def) => ({
    ...def,
    status: 'idle' as TestStatus,
    duration: null,
    lastRun: null,
    error: null,
  }))
}

export async function getTestDefinitions(): Promise<TestSuiteResult> {
  return {
    tests: createIdleTests(),
    overallStatus: 'idle',
    summary: `${TEST_DEFINITIONS.length} tests available`,
  }
}

export async function runE2ETest(testId: string): Promise<TestCase> {
  const def = TEST_DEFINITIONS.find((t) => t.id === testId)
  if (!def) {
    return {
      ...createIdleTests()[0],
      id: testId,
      name: 'Unknown test',
      status: 'error',
      error: `Test ID "${testId}" not found`,
    }
  }

  const startTime = Date.now()
  try {
    const { stdout, stderr } = await execFileAsync(
      'npx',
      [
        'playwright',
        'test',
        'tests-e2e/group-chat-production.spec.ts',
        '--project=chromium',
        '--grep',
        def.grepPattern,
        '--reporter=line',
      ],
      {
        cwd: PROJECT_ROOT,
        timeout: 180_000,
        env: { ...process.env, CI: 'true' },
      }
    )

    const durationMs = Date.now() - startTime
    const output = stdout + stderr
    const passed = output.includes('passed') && !output.includes('failed')

    return {
      ...def,
      status: passed ? 'passed' : 'failed',
      duration: `${(durationMs / 1000).toFixed(1)}s`,
      lastRun: new Date().toLocaleTimeString(),
      error: passed ? null : extractError(output),
    }
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime
    const message = err instanceof Error ? err.message : String(err)
    const stderrOutput = (err as { stderr?: string }).stderr || ''

    return {
      ...def,
      status: 'failed',
      duration: `${(durationMs / 1000).toFixed(1)}s`,
      lastRun: new Date().toLocaleTimeString(),
      error: extractError(stderrOutput) || message.slice(0, 500),
    }
  }
}

export async function runAllE2ETests(): Promise<TestSuiteResult> {
  const results: TestCase[] = []

  for (const def of TEST_DEFINITIONS) {
    const result = await runE2ETest(def.id)
    results.push(result)
  }

  const failedCount = results.filter((r) => r.status === 'failed' || r.status === 'error').length
  const passedCount = results.filter((r) => r.status === 'passed').length

  return {
    tests: results,
    overallStatus: failedCount > 0 ? 'failed' : 'passed',
    summary: `${passedCount} passed · ${failedCount} failed · ${results.length} total`,
  }
}

function extractError(output: string): string | null {
  const errorMatch = output.match(/Error:[\s\S]*?(?=\n\s*\n|\n\s*at|$)/)
  if (errorMatch) {
    return errorMatch[0].trim().slice(0, 500)
  }
  const failMatch = output.match(/\d+ failed[\s\S]*?(?=\d+ passed|\d+ skipped|$)/)
  if (failMatch) {
    return failMatch[0].trim().slice(0, 500)
  }
  return null
}
