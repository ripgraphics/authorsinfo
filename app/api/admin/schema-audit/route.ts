import { NextRequest, NextResponse } from 'next/server'
import {
  auditSchemaAgainstMigrations,
  generateMigrationSuggestions,
} from '@/lib/schema/migration-auditor'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableNames = searchParams.get('tables')?.split(',').filter(Boolean)

    // Run audit
    const auditResult = await auditSchemaAgainstMigrations(tableNames)

    // Generate suggestions
    const suggestions = generateMigrationSuggestions(auditResult)

    return NextResponse.json({
      success: true,
      audit: auditResult,
      suggestions,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error running schema audit:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
