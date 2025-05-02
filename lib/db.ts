import { cache } from "./cache"
import { getSupabaseClient } from "./supabase/client"
import { Database } from "@/types/database"

type QueryOptions = {
  ttl?: number
  cacheKey?: string
  orderBy?: Record<string, 'asc' | 'desc'>
  limit?: number
  offset?: number
  count?: boolean
  select?: string | string[]
}

export class DB {
  private static instance: DB
  private supabase = getSupabaseClient()

  private constructor() {}

  static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB()
    }
    return DB.instance
  }

  private generateCacheKey(table: string, query: any): string {
    return `${table}:${JSON.stringify(query)}`
  }

  async query<T = any>(
    table: string,
    query: any,
    options: QueryOptions = {}
  ): Promise<T[] | { count: number }> {
    const cacheKey = options.cacheKey || this.generateCacheKey(table, query)
    const cached = cache.get<T[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    // Convert string[] to comma-separated string for Supabase select
    const selectValue = options.select 
      ? Array.isArray(options.select) 
        ? options.select.join(',') 
        : options.select 
      : '*'

    let q = this.supabase.from(table).select(selectValue, { count: options.count ? 'exact' : undefined })

    // Handle date ranges and other special queries
    Object.entries(query).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if ('gte' in value && 'lte' in value) {
          q = q.gte(key, value.gte).lte(key, value.lte)
        } else if ('ilike' in value) {
          q = q.ilike(key, value.ilike as string)
        } else if ('not' in value) {
          q = q.not(key, 'is', null)
        } else {
          q = q.match(value)
        }
      } else {
        q = q.eq(key, value)
      }
    })

    if (options.orderBy) {
      Object.entries(options.orderBy).forEach(([key, direction]) => {
        q = q.order(key, { ascending: direction === 'asc' })
      })
    }

    if (options.limit) {
      q = q.limit(options.limit)
    }

    if (options.offset) {
      q = q.range(options.offset, options.offset + (options.limit || 0) - 1)
    }

    const { data, error, count } = await q

    if (error) {
      throw error
    }

    if (options.count) {
      return { count: count || 0 }
    }

    const result = data as T[]
    cache.set(cacheKey, result, options.ttl)
    return result
  }

  async getById<T = any>(
    table: string,
    id: string | number,
    options: QueryOptions = {}
  ): Promise<T | null> {
    const cacheKey = options.cacheKey || `${table}:${id}`
    const cached = cache.get<T>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await this.supabase
      .from(table)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (data) {
      cache.set(cacheKey, data, options.ttl)
    }
    return data
  }

  async insert<T = any>(
    table: string,
    data: Partial<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Invalidate related caches
    cache.delete(`${table}:${result.id}`)
    return result
  }

  async update<T = any>(
    table: string,
    id: string | number,
    data: Partial<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Invalidate related caches
    cache.delete(`${table}:${id}`)
    return result
  }

  async delete(
    table: string,
    id: string | number,
    options: QueryOptions = {}
  ): Promise<void> {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    // Invalidate related caches
    cache.delete(`${table}:${id}`)
  }
}

export const db = DB.getInstance() 