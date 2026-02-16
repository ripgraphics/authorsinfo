import 'server-only'
import pino, { type Logger, type LoggerOptions } from 'pino'

const logLevel = process.env.LOG_LEVEL ?? 'info'
const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

const baseOptions: LoggerOptions = {
  level: logLevel,
  base: {
    env: process.env.NODE_ENV,
    service: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? 'authorsinfo',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers.x-api-key',
      'headers.authorization',
      'headers.cookie',
      'headers.x-api-key',
    ],
    censor: '[REDACTED]',
  },
}

function createLogger(): Logger {
  // Never use pretty logging in production or on Vercel
  if (!isDevelopment) {
    return pino(baseOptions)
  }

  try {
    return pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      },
    })
  } catch (error) {
    // Never allow logging setup to crash runtime handlers.
    console.warn('Failed to initialize pino-pretty transport; using JSON logger.', error)
    return pino(baseOptions)
  }
}

export const logger = createLogger()

export const logError = (message: string, error: unknown, context?: Record<string, unknown>) => {
  logger.error(
    {
      err: error,
      ...context,
    },
    message
  )
}

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  logger.info(
    {
      ...context,
    },
    message
  )
}

export const logWarn = (message: string, context?: Record<string, unknown>) => {
  logger.warn(
    {
      ...context,
    },
    message
  )
}

export const logDebug = (message: string, context?: Record<string, unknown>) => {
  logger.debug(
    {
      ...context,
    },
    message
  )
}
