/**
 * Environment Variable Validator
 *
 * This module provides type-safe environment variable validation at startup.
 * All required environment variables are validated before the application runs.
 *
 * Usage:
 *   import { validateEnv } from '@/lib/env-validator'
 *   validateEnv()  // Call at startup
 */

import { logger } from '@/lib/logger'

/**
 * Environment variable schema with validation
 */
interface EnvVars {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string

  // Node environment
  NODE_ENV: 'development' | 'production' | 'test'
}

/**
 * Validates that required environment variables are set
 * Throws an error if any are missing
 */
export function validateEnv(): void {
  const errors: string[] = []

  // Validate public Supabase variables (required on client and server)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else if (!isValidUrl(supabaseUrl)) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
  }

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // Validate server-side Supabase variables (required only on server)
  if (isServerSide()) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required on server-side')
    }
  }

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV
  if (!nodeEnv || !['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be one of: development, production, test')
  }

  if (errors.length > 0) {
    const message = `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    logger.error({ errors }, 'Environment validation failed')
    throw new Error(message)
  }

  logger.info('Environment variables validated successfully')
}

/**
 * Gets a typed environment variable with fallback
 */
export function getEnv<T extends keyof EnvVars>(key: T, fallback?: string): string {
  const value = process.env[key] || fallback

  if (!value) {
    throw new Error(`Environment variable ${key} is not set`)
  }

  return value
}

/**
 * Checks if running on server-side
 */
function isServerSide(): boolean {
  return typeof window === 'undefined'
}

/**
 * Validates URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString)
    return true
  } catch {
    return false
  }
}

/**
 * Gets all Supabase environment variables
 */
export function getSupabaseEnv() {
  return {
    url: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

/**
 * Checks if running in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Checks if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Checks if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}
