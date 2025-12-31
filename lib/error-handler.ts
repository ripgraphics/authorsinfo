/**
 * Safe Error Handler Utility
 *
 * This module provides type-safe error handling for API routes and server actions.
 * It prevents accidental exposure of sensitive error details to clients.
 *
 * Usage:
 *   import { handleError } from '@/lib/error-handler'
 *
 *   try {
 *     // ... do something
 *   } catch (error) {
 *     return handleError(error, 'Operation failed')
 *   }
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export interface ErrorResponse {
  error: string
  details?: any
}

/**
 * Determines if an error object is an Error instance
 */
function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Sanitizes error for logging (includes full details)
 */
function sanitizeErrorForLogging(error: unknown): any {
  if (isError(error)) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return {
    value: error,
    type: typeof error,
  }
}

/**
 * Sanitizes error for client response (excludes sensitive details)
 * Development: includes error.message
 * Production: generic error message only
 */
function sanitizeErrorForResponse(error: unknown, isDevelopment: boolean = false): string {
  // Never expose stack traces or internal details to clients
  if (isDevelopment && isError(error)) {
    return error.message
  }
  return 'An error occurred processing your request'
}

/**
 * Type-safe error handler for API routes and server actions
 *
 * @param error - The error object to handle
 * @param defaultMessage - Default message to return to client
 * @param isDevelopment - Whether to include error details in response
 * @returns Sanitized error response
 */
export function handleError(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): ErrorResponse {
  // Log full error details for debugging (server-side only)
  logger.error({ err: sanitizeErrorForLogging(error) }, defaultMessage)

  // Return sanitized error to client
  return {
    error: sanitizeErrorForResponse(error, isDevelopment) || defaultMessage,
  }
}

/**
 * Creates a NextResponse error with proper error handling
 */
export function nextErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  statusCode: number = 500,
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): NextResponse<ErrorResponse> {
  const response = handleError(error, defaultMessage, isDevelopment)
  return NextResponse.json(response, { status: statusCode })
}

/**
 * Type-safe database error handler
 * Checks for common database errors and returns appropriate status codes
 */
export function handleDatabaseError(
  error: unknown,
  defaultMessage: string = 'Database operation failed'
): { message: string; statusCode: number } {
  // Log the error
  logger.error({ err: sanitizeErrorForLogging(error) }, defaultMessage)

  // Check for specific database error patterns
  const errorString = String(error)

  // Foreign key constraint violations
  if (errorString.includes('foreign key') || errorString.includes('violates')) {
    return { message: 'Invalid reference provided', statusCode: 400 }
  }

  // Duplicate key/unique constraint violations
  if (errorString.includes('duplicate') || errorString.includes('unique')) {
    return { message: 'This record already exists', statusCode: 409 }
  }

  // Permission/authorization errors
  if (errorString.includes('permission') || errorString.includes('denied')) {
    return { message: 'You do not have permission to perform this action', statusCode: 403 }
  }

  // Not found errors
  if (errorString.includes('not found') || errorString.includes('no rows')) {
    return { message: 'Record not found', statusCode: 404 }
  }

  // Generic database error
  return { message: defaultMessage, statusCode: 500 }
}

/**
 * Type-safe validation error handler
 */
export function handleValidationError(
  errors: any,
  defaultMessage: string = 'Validation failed'
): ErrorResponse {
  logger.error({ err: { errors } }, defaultMessage)

  return {
    error: defaultMessage,
    // Only include field-level errors, not internal details
    details:
      errors && typeof errors === 'object' && 'fieldErrors' in errors
        ? errors.fieldErrors
        : undefined,
  }
}

/**
 * Type-safe authentication error response
 */
export function unauthorizedError(): ErrorResponse {
  return {
    error: 'Authentication required',
  }
}

/**
 * Type-safe permission error response
 */
export function forbiddenError(message?: string): ErrorResponse {
  return {
    error: message || 'You do not have permission to perform this action',
  }
}

/**
 * Type-safe bad request error response
 */
export function badRequestError(message: string): ErrorResponse {
  return {
    error: message,
  }
}

/**
 * Type-safe not found error response
 */
export function notFoundError(resource: string = 'Resource'): ErrorResponse {
  return {
    error: `${resource} not found`,
  }
}
