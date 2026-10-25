import { NextRequest, NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import path from 'path'
import { sync } from 'execa'

const BASE_DIR = process.cwd()
const TEST_FILE_MAP: Record<string, string> = {
  'group-chat-production': 'tests-e2e/group-chat-production.spec.ts',
  'direct-messaging-blocking': 'tests-e2e/direct-messaging-blocking.spec.ts',
  'websockets': 'tests-e2e/websockets.spec.ts',
  'cross-post-functionality': 'tests-e2e/cross-post-functionality.spec.ts',
  'cross-post-api': 'tests-e2e/cross-post-api.spec.ts',
  'cross-post-badge': 'tests-e2e/cross-post-badge.spec.ts',
  'link-preview-modal': 'tests-e2e/link-preview-modal.spec.ts',
  'engagement-hover-popup': 'tests-e2e/engagement-hover-popup.spec.ts',
  'entity-tab-theme-blue': 'tests-e2e/entity-tab-theme-blue.spec.ts',
  'profile-currently-reading': 'tests-e2e/profile-currently-reading.spec.ts',
  'tagging-integration': 'tests-e2e/tagging-integration.spec.ts',
  'measure-button-widths': 'tests-e2e/measure-button-widths.spec.ts',
}

export async function GET() {
  return NextResponse.json({ tests: Object.keys(TEST_FILE_MAP) })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const testName = body.name as string

    if (!testName || !TEST_FILE_MAP[testName]) {
      return NextResponse.json({ error: 'Invalid test name' }, { status: 400 })
    }

    const testFile = TEST_FILE_MAP[testName]
    const playwrightPath = path.join(BASE_DIR, 'node_modules', '.bin', 'playwright')
    const testArgs = ['test', testFile, '--project=chromium', '--reporter=line', '--timeout=60000']

    const result = execFileSync(process.execPath, [playwrightPath, ...testArgs], {
      cwd: BASE_DIR,
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    })

    const pass = result.includes('1 passed') || result.includes('passed')
    return NextResponse.json({ 
      output: result,
      passed: pass,
      name: testName 
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
