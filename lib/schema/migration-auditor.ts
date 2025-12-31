import { schemaService } from './supabase-schema-service'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export interface ColumnDiff {
  column_name: string
  expected: string | null
  actual: string | null
  status: 'missing' | 'extra' | 'mismatch'
}

export interface PolicyDiff {
  policy_name: string
  expected: string | null
  actual: string | null
  status: 'missing' | 'extra' | 'mismatch'
}

export interface TableAuditResult {
  table_name: string
  exists: boolean
  column_diffs: ColumnDiff[]
  policy_diffs: PolicyDiff[]
  has_rls_enabled: boolean
  expected_rls_enabled: boolean
  rls_mismatch: boolean
}

export interface MigrationAuditResult {
  tables: TableAuditResult[]
  summary: {
    total_tables: number
    tables_with_issues: number
    missing_columns: number
    extra_columns: number
    missing_policies: number
    extra_policies: number
  }
  errors: string[]
}

/**
 * Extract expected schema from migration files
 */
async function extractExpectedSchemaFromMigrations(): Promise<
  Map<
    string,
    {
      columns: Set<string>
      policies: Set<string>
      rls_enabled: boolean
    }
  >
> {
  const expectedSchema = new Map<
    string,
    {
      columns: Set<string>
      policies: Set<string>
      rls_enabled: boolean
    }
  >()

  try {
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
    const files = await readdir(migrationsDir)
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort()

    for (const file of sqlFiles) {
      const content = await readFile(join(migrationsDir, file), 'utf-8')

      // Extract CREATE TABLE statements
      const createTableRegex =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["']?(\w+)["']?/gi
      let match
      while ((match = createTableRegex.exec(content)) !== null) {
        const tableName = match[1]
        if (!expectedSchema.has(tableName)) {
          expectedSchema.set(tableName, {
            columns: new Set(),
            policies: new Set(),
            rls_enabled: false,
          })
        }
      }

      // Extract ALTER TABLE ADD COLUMN statements
      const addColumnRegex =
        /ALTER\s+TABLE\s+(?:public\.)?["']?(\w+)["']?\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/gi
      while ((match = addColumnRegex.exec(content)) !== null) {
        const tableName = match[1]
        const columnName = match[2]
        if (!expectedSchema.has(tableName)) {
          expectedSchema.set(tableName, {
            columns: new Set(),
            policies: new Set(),
            rls_enabled: false,
          })
        }
        expectedSchema.get(tableName)!.columns.add(columnName)
      }

      // Extract CREATE POLICY statements
      const createPolicyRegex =
        /CREATE\s+POLICY\s+["']?(\w+)["']?\s+ON\s+(?:public\.)?["']?(\w+)["']?/gi
      while ((match = createPolicyRegex.exec(content)) !== null) {
        const policyName = match[1]
        const tableName = match[2]
        if (!expectedSchema.has(tableName)) {
          expectedSchema.set(tableName, {
            columns: new Set(),
            policies: new Set(),
            rls_enabled: false,
          })
        }
        expectedSchema.get(tableName)!.policies.add(policyName)
      }

      // Extract ENABLE ROW LEVEL SECURITY
      const enableRLSRegex =
        /ALTER\s+TABLE\s+(?:public\.)?["']?(\w+)["']?\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi
      while ((match = enableRLSRegex.exec(content)) !== null) {
        const tableName = match[1]
        if (!expectedSchema.has(tableName)) {
          expectedSchema.set(tableName, {
            columns: new Set(),
            policies: new Set(),
            rls_enabled: true,
          })
        } else {
          expectedSchema.get(tableName)!.rls_enabled = true
        }
      }
    }
  } catch (error) {
    console.error('Error reading migration files:', error)
  }

  return expectedSchema
}

/**
 * Audit database schema against migration files
 */
export async function auditSchemaAgainstMigrations(
  tableNames?: string[]
): Promise<MigrationAuditResult> {
  const errors: string[] = []
  const tables: TableAuditResult[] = []

  try {
    // Get expected schema from migrations
    const expectedSchema = await extractExpectedSchemaFromMigrations()

    // Get actual tables from database
    const actualTables = tableNames || (await schemaService.getAllTables())

    // Audit each table
    for (const tableName of actualTables) {
      try {
        const actualSchema = await schemaService.getTableSchema(tableName)
        const expected = expectedSchema.get(tableName) || {
          columns: new Set(),
          policies: new Set(),
          rls_enabled: false,
        }

        // Compare columns
        const actualColumns = new Set(actualSchema.columns.map((c) => c.column_name))
        const columnDiffs: ColumnDiff[] = []

        // Find missing columns (in expected but not in actual)
        for (const expectedCol of expected.columns) {
          if (!actualColumns.has(expectedCol)) {
            columnDiffs.push({
              column_name: expectedCol,
              expected: 'exists',
              actual: null,
              status: 'missing',
            })
          }
        }

        // Find extra columns (in actual but not in expected)
        for (const actualCol of actualColumns) {
          if (!expected.columns.has(actualCol)) {
            columnDiffs.push({
              column_name: actualCol,
              expected: null,
              actual: 'exists',
              status: 'extra',
            })
          }
        }

        // Compare policies
        const actualPolicies = new Set(actualSchema.rls_policies.map((p) => p.policyname))
        const policyDiffs: PolicyDiff[] = []

        // Find missing policies
        for (const expectedPolicy of expected.policies) {
          if (!actualPolicies.has(expectedPolicy)) {
            policyDiffs.push({
              policy_name: expectedPolicy,
              expected: 'exists',
              actual: null,
              status: 'missing',
            })
          }
        }

        // Find extra policies
        for (const actualPolicy of actualPolicies) {
          if (!expected.policies.has(actualPolicy)) {
            policyDiffs.push({
              policy_name: actualPolicy,
              expected: null,
              actual: 'exists',
              status: 'extra',
            })
          }
        }

        tables.push({
          table_name: tableName,
          exists: true,
          column_diffs: columnDiffs,
          policy_diffs: policyDiffs,
          has_rls_enabled: actualSchema.has_rls_enabled,
          expected_rls_enabled: expected.rls_enabled,
          rls_mismatch: actualSchema.has_rls_enabled !== expected.rls_enabled,
        })
      } catch (error) {
        errors.push(
          `Error auditing table ${tableName}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    // Calculate summary
    const tablesWithIssues = tables.filter(
      (t) => t.column_diffs.length > 0 || t.policy_diffs.length > 0 || t.rls_mismatch
    ).length

    const missingColumns = tables.reduce(
      (sum, t) => sum + t.column_diffs.filter((d) => d.status === 'missing').length,
      0
    )
    const extraColumns = tables.reduce(
      (sum, t) => sum + t.column_diffs.filter((d) => d.status === 'extra').length,
      0
    )
    const missingPolicies = tables.reduce(
      (sum, t) => sum + t.policy_diffs.filter((d) => d.status === 'missing').length,
      0
    )
    const extraPolicies = tables.reduce(
      (sum, t) => sum + t.policy_diffs.filter((d) => d.status === 'extra').length,
      0
    )

    return {
      tables,
      summary: {
        total_tables: tables.length,
        tables_with_issues: tablesWithIssues,
        missing_columns: missingColumns,
        extra_columns: extraColumns,
        missing_policies: missingPolicies,
        extra_policies: extraPolicies,
      },
      errors,
    }
  } catch (error) {
    errors.push(
      `Fatal error during audit: ${error instanceof Error ? error.message : String(error)}`
    )
    return {
      tables: [],
      summary: {
        total_tables: 0,
        tables_with_issues: 0,
        missing_columns: 0,
        extra_columns: 0,
        missing_policies: 0,
        extra_policies: 0,
      },
      errors,
    }
  }
}

/**
 * Generate migration suggestions based on audit results
 */
export function generateMigrationSuggestions(auditResult: MigrationAuditResult): string[] {
  const suggestions: string[] = []

  for (const table of auditResult.tables) {
    // Suggest adding missing columns
    const missingColumns = table.column_diffs.filter((d) => d.status === 'missing')
    if (missingColumns.length > 0) {
      suggestions.push(
        `Table ${table.table_name} is missing columns: ${missingColumns.map((c) => c.column_name).join(', ')}`
      )
    }

    // Suggest removing extra columns (if they're not needed)
    const extraColumns = table.column_diffs.filter((d) => d.status === 'extra')
    if (extraColumns.length > 0) {
      suggestions.push(
        `Table ${table.table_name} has extra columns not in migrations: ${extraColumns.map((c) => c.column_name).join(', ')}`
      )
    }

    // Suggest adding missing policies
    const missingPolicies = table.policy_diffs.filter((d) => d.status === 'missing')
    if (missingPolicies.length > 0) {
      suggestions.push(
        `Table ${table.table_name} is missing RLS policies: ${missingPolicies.map((p) => p.policy_name).join(', ')}`
      )
    }

    // Suggest RLS enablement
    if (table.rls_mismatch) {
      if (table.expected_rls_enabled && !table.has_rls_enabled) {
        suggestions.push(`Table ${table.table_name} should have RLS enabled but doesn't`)
      } else if (!table.expected_rls_enabled && table.has_rls_enabled) {
        suggestions.push(`Table ${table.table_name} has RLS enabled but migrations don't expect it`)
      }
    }
  }

  return suggestions
}
