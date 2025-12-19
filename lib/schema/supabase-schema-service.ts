import { supabaseAdmin } from "@/lib/supabase/server"

export interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: 'YES' | 'NO'
  column_default: string | null
  udt_name?: string
}

export interface RLSPolicy {
  schemaname: string
  tablename: string
  policyname: string
  permissive: string
  roles: string[]
  cmd: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  qual: string | null
  with_check: string | null
}

export interface TableSchema {
  table_name: string
  columns: ColumnInfo[]
  rls_policies: RLSPolicy[]
  has_rls_enabled: boolean
}

export interface CachedSchema {
  schema: TableSchema
  timestamp: number
  ttl: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  filteredPayload: Record<string, any>
}

/**
 * Comprehensive Supabase Schema Service
 * Queries Supabase directly for full database metadata
 */
export class SupabaseSchemaService {
  private static instance: SupabaseSchemaService
  private cache: Map<string, CachedSchema> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): SupabaseSchemaService {
    if (!SupabaseSchemaService.instance) {
      SupabaseSchemaService.instance = new SupabaseSchemaService()
    }
    return SupabaseSchemaService.instance
  }

  /**
   * Get table schema with caching
   */
  async getTableSchema(tableName: string, useCache = true): Promise<TableSchema> {
    const cacheKey = `schema:${tableName}`
    
    if (useCache) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.schema
      }
    }

    try {
      const [columns, rlsPolicies, hasRLSEnabled] = await Promise.all([
        this.getTableColumns(tableName),
        this.getRLSPolicies(tableName),
        this.checkRLSEnabled(tableName)
      ])

      const schema: TableSchema = {
        table_name: tableName,
        columns,
        rls_policies: rlsPolicies,
        has_rls_enabled: hasRLSEnabled
      }

      this.cache.set(cacheKey, {
        schema,
        timestamp: Date.now(),
        ttl: this.defaultTTL
      })

      return schema
    } catch (error) {
      console.error(`Error fetching schema for table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * Get table columns using RPC or fallback method
   */
  private async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    try {
      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_table_columns', {
        p_table_name: tableName
      })

      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData.map((row: any) => ({
          column_name: row.column_name,
          data_type: row.data_type,
          is_nullable: row.is_nullable === 'YES' ? 'YES' : 'NO',
          column_default: row.column_default,
          udt_name: row.udt_name
        }))
      }

      // Fallback: Get sample row to infer columns
      const { data: sampleRow, error: sampleError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1)
        .maybeSingle()

      if (sampleError) {
        // If table is empty or doesn't exist, try to get at least column names
        // by attempting a select with known common columns
        console.warn(`Could not get sample row for ${tableName}, trying alternative method`)
        
        // Return empty array if we can't determine columns
        return []
      }

      if (!sampleRow) {
        // Empty table - return empty columns array
        return []
      }

      // Extract column info from sample row
      const columns: ColumnInfo[] = Object.keys(sampleRow).map((columnName) => {
        const value = sampleRow[columnName]
        return {
          column_name: columnName,
          data_type: this.inferDataType(value),
          is_nullable: value === null ? 'YES' : 'NO',
          column_default: null,
          udt_name: this.inferUdtName(value)
        }
      })

      return columns
    } catch (error) {
      console.error(`Error getting columns for ${tableName}:`, error)
      return []
    }
  }

  /**
   * Get RLS policies for a table
   */
  private async getRLSPolicies(tableName: string): Promise<RLSPolicy[]> {
    try {
      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_table_rls_policies', {
        p_table_name: tableName
      })

      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        return rpcData.map((row: any) => ({
          schemaname: row.schemaname || 'public',
          tablename: row.tablename || tableName,
          policyname: row.policy_name || row.policyname,
          permissive: row.permissive || 'PERMISSIVE',
          roles: Array.isArray(row.roles) ? row.roles : [row.roles || 'public'],
          cmd: this.parseCmd(row.cmd || row.command),
          qual: row.qual || row.qualification || null,
          with_check: row.with_check || null
        }))
      }

      // Fallback: Return empty array if RPC not available
      return []
    } catch (error) {
      console.warn(`Could not fetch RLS policies for ${tableName}:`, error)
      return []
    }
  }

  /**
   * Check if RLS is enabled for a table
   */
  private async checkRLSEnabled(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin.rpc('check_table_rls_enabled', {
        p_table_name: tableName
      })

      if (!error && data !== null && data !== undefined) {
        return Boolean(data)
      }

      // Fallback: Assume RLS might be enabled if we have policies
      const policies = await this.getRLSPolicies(tableName)
      return policies.length > 0
    } catch (error) {
      // Default to false if we can't determine
      return false
    }
  }

  /**
   * Get column info for a specific column
   */
  async getColumnInfo(tableName: string, columnName: string): Promise<ColumnInfo | null> {
    const schema = await this.getTableSchema(tableName)
    return schema.columns.find(col => col.column_name === columnName) || null
  }

  /**
   * Check if a column exists in a table
   */
  async checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
    const schema = await this.getTableSchema(tableName)
    return schema.columns.some(col => col.column_name === columnName)
  }

  /**
   * Get all table names in the database
   */
  async getAllTables(): Promise<string[]> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_all_tables')

      if (!error && data && Array.isArray(data)) {
        return data.map((row: any) => row.table_name || row)
      }

      // Fallback: Try common tables
      const commonTables = ['activities', 'users', 'profiles', 'books', 'authors', 'publishers']
      const existingTables: string[] = []

      for (const table of commonTables) {
        try {
          const { error } = await supabaseAdmin.from(table).select('id').limit(1)
          if (!error) {
            existingTables.push(table)
          }
        } catch {
          // Table doesn't exist or not accessible
        }
      }

      return existingTables
    } catch (error) {
      console.error('Error getting all tables:', error)
      return []
    }
  }

  /**
   * Validate insert payload against actual schema
   */
  async validateInsertPayload(tableName: string, payload: Record<string, any>): Promise<ValidationResult> {
    const schema = await this.getTableSchema(tableName)
    const errors: string[] = []
    const warnings: string[] = []
    const filteredPayload: Record<string, any> = {}

    const columnNames = new Set(schema.columns.map(col => col.column_name))

    for (const [key, value] of Object.entries(payload)) {
      if (columnNames.has(key)) {
        filteredPayload[key] = value
      } else {
        errors.push(`Column '${key}' does not exist in table '${tableName}'`)
      }
    }

    // Check for required columns (non-nullable without defaults)
    for (const column of schema.columns) {
      if (column.is_nullable === 'NO' && !column.column_default && !(column.column_name in filteredPayload)) {
        // Skip auto-generated columns
        if (column.column_name !== 'id' && column.column_name !== 'created_at' && column.column_name !== 'updated_at') {
          warnings.push(`Required column '${column.column_name}' is missing from payload`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      filteredPayload
    }
  }

  /**
   * Clear cache for a specific table or all tables
   */
  clearCache(tableName?: string): void {
    if (tableName) {
      this.cache.delete(`schema:${tableName}`)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Infer data type from JavaScript value
   */
  private inferDataType(value: any): string {
    if (value === null || value === undefined) {
      return 'unknown'
    }

    if (Array.isArray(value)) {
      return 'array'
    }

    if (typeof value === 'object' && value.constructor === Object) {
      return 'jsonb'
    }

    const jsType = typeof value
    const typeMap: Record<string, string> = {
      'string': 'text',
      'number': value % 1 === 0 ? 'integer' : 'numeric',
      'boolean': 'boolean',
      'bigint': 'bigint'
    }

    return typeMap[jsType] || 'text'
  }

  /**
   * Infer UDT name from JavaScript value
   */
  private inferUdtName(value: any): string {
    if (value === null || value === undefined) {
      return 'text'
    }

    if (Array.isArray(value)) {
      return 'text[]'
    }

    if (typeof value === 'object' && value.constructor === Object) {
      return 'jsonb'
    }

    const jsType = typeof value
    const typeMap: Record<string, string> = {
      'string': 'text',
      'number': value % 1 === 0 ? 'int4' : 'numeric',
      'boolean': 'bool',
      'bigint': 'int8'
    }

    return typeMap[jsType] || 'text'
  }

  /**
   * Parse command string to RLSPolicy cmd type
   */
  private parseCmd(cmd: string): RLSPolicy['cmd'] {
    const upperCmd = cmd?.toUpperCase() || ''
    if (['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(upperCmd)) {
      return upperCmd as RLSPolicy['cmd']
    }
    return 'ALL'
  }
}

// Export singleton instance
export const schemaService = SupabaseSchemaService.getInstance()

