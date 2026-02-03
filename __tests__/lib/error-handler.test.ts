/**
 * Unit tests for lib/error-handler
 * @jest-environment node
 */
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: { error: string }, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status ?? 500,
    }),
  },
}))

import { handleError, handleDatabaseError, nextErrorResponse } from '@/lib/error-handler'

describe('handleError', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('returns default message for Error in production', () => {
    process.env.NODE_ENV = 'production'
    const err = new Error('Sensitive internal error')
    const result = handleError(err, 'Operation failed', false)
    expect(result.error).toBe('An error occurred processing your request')
  })

  it('returns error message in development when isDevelopment is true', () => {
    const err = new Error('Validation failed')
    const result = handleError(err, 'Operation failed', true)
    expect(result.error).toBe('Validation failed')
  })

  it('returns default message for non-Error values', () => {
    const result = handleError('string error', 'Operation failed')
    expect(result.error).toBe('An error occurred processing your request')
  })

  it('returns defaultMessage when provided', () => {
    const err = new Error('Internal')
    const result = handleError(err, 'Custom failure message', false)
    expect(result.error).toBe('An error occurred processing your request')
  })
})

describe('handleDatabaseError', () => {
  it('returns 400 for foreign key violations', () => {
    const err = new Error('violates foreign key constraint')
    const { message, statusCode } = handleDatabaseError(err, 'Database failed')
    expect(statusCode).toBe(400)
    expect(message).toBe('Invalid reference provided')
  })

  it('returns 409 for duplicate key violations', () => {
    const err = new Error('duplicate key value')
    const { message, statusCode } = handleDatabaseError(err, 'Database failed')
    expect(statusCode).toBe(409)
    expect(message).toBe('This record already exists')
  })

  it('returns 403 for permission errors', () => {
    const err = new Error('permission denied')
    const { message, statusCode } = handleDatabaseError(err, 'Database failed')
    expect(statusCode).toBe(403)
    expect(message).toBe('You do not have permission to perform this action')
  })

  it('returns 404 for not found errors', () => {
    const err = new Error('no rows returned')
    const { message, statusCode } = handleDatabaseError(err, 'Database failed')
    expect(statusCode).toBe(404)
    expect(message).toBe('Record not found')
  })

  it('returns 500 and default message for generic errors', () => {
    const err = new Error('Connection refused')
    const { message, statusCode } = handleDatabaseError(err, 'Database operation failed')
    expect(statusCode).toBe(500)
    expect(message).toBe('Database operation failed')
  })
})

describe('nextErrorResponse', () => {
  it('returns NextResponse with status 500 by default', async () => {
    const err = new Error('Test error')
    const response = nextErrorResponse(err, 'Failed', 500, false)
    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json).toHaveProperty('error')
    expect(json.error).toBe('An error occurred processing your request')
  })

  it('returns NextResponse with custom status code', async () => {
    const err = new Error('Test')
    const response = nextErrorResponse(err, 'Not found', 404, false)
    expect(response.status).toBe(404)
  })
})
