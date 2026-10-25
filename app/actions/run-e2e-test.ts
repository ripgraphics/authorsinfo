'use server'

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/rbac'

const execFileAsync = promisify(execFile)

// On Windows the Playwright CLI is a .cmd shim, which execFile cannot run
// directly without a shell. Resolve the real local binary instead.
const IS_WINDOWS = process.platform === 'win32'
const PLAYWRIGHT_BIN = IS_WINDOWS
  ? path.join('node_modules', '.bin', 'playwright.cmd')
  : path.join('node_modules', '.bin', 'playwright')

async function requireAdmin() {
  const role = await getCurrentUserRole()
  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/')
  }
}

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
  await requireAdmin()
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

  if (!existsSync(path.resolve(PROJECT_ROOT, PLAYWRIGHT_BIN))) {
    return {
      ...def,
      status: 'error',
      duration: null,
      lastRun: new Date().toLocaleTimeString(),
      error:
        'Playwright is not installed in this environment. E2E tests require Playwright plus its browsers, which are not available on serverless production hosting. Run these tests locally with: npm run test:e2e',
    }
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      PLAYWRIGHT_BIN,
      [
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
        // Do NOT force CI=true: playwright.config.ts uses `reuseExistingServer: !process.env.CI`,
        // so forcing CI makes Playwright try to start its own dev server and fail on the busy port.
        env: { ...process.env },
        shell: IS_WINDOWS,
        maxBuffer: 10 * 1024 * 1024,
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
  await requireAdmin()
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
