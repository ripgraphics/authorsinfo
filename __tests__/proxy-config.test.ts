/** @jest-environment node */

import { config } from '@/proxy'

test('refreshes Supabase sessions on application and API requests', () => {
  expect(config.matcher).toEqual([
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ])
})

test('keeps public routes available while the proxy refreshes sessions', () => {
  expect('/login').not.toMatch(/^\/api\/admin|^\/api\/debug|^\/admin/)
})
