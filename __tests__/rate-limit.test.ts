/** @jest-environment node */

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}))

const limit = jest.fn(() => new Promise<never>(() => undefined))
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() { return {} }
    limit = limit
  },
}))
jest.mock('@upstash/redis', () => ({
  Redis: { fromEnv: jest.fn(() => ({})) },
}))

test('fails open quickly when the rate-limit provider is unavailable', async () => {
  jest.resetModules()
  process.env.NODE_ENV = 'development'
  process.env.UPSTASH_REDIS_REST_URL = 'https://unreachable.example'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

  let checkRateLimit: typeof import('@/lib/rate-limit').checkRateLimit
  await jest.isolateModulesAsync(async () => {
    checkRateLimit = (await import('@/lib/rate-limit')).checkRateLimit
  })
  const startedAt = Date.now()
  const result = await checkRateLimit('test-user')

  expect(Date.now() - startedAt).toBeLessThan(1500)
  expect(result.success).toBe(true)
})
