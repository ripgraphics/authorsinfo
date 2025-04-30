import { cache } from "./cache"
import { getSupabaseClient } from "./supabase/client"
import { Database } from "@/types/database"

type QueryOptions = {
  ttl?: number
  cacheKey?: string
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
  ): Promise<T[]> {
    const cacheKey = options.cacheKey || this.generateCacheKey(table, query)
    const cached = cache.get<T[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    let q = this.supabase.from(table).select()

    // Handle date ranges and other special queries
    Object.entries(query).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if ('gte' in value && 'lte' in value) {
          q = q.gte(key, value.gte).lte(key, value.lte)
        } else if ('ilike' in value) {
          q = q.ilike(key, value.ilike)
        } else if ('not' in value) {
          q = q.not(key, 'is', null)
        } else {
          q = q.match({ [key]: value })
        }
      } else {
        q = q.match({ [key]: value })
      }
    })

    const { data, error } = await q

    if (error) {
      throw error
    }

    cache.set(cacheKey, data, options.ttl)
    return data
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