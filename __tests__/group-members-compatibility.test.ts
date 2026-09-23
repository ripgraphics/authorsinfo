/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/groups/[id]/members/route'

const groupId = '11111111-1111-4111-8111-111111111111'
const context = { params: Promise.resolve({ id: groupId }) }

test('redirects legacy group members GET to the canonical Messenger members route', async () => {
  const response = await GET(new NextRequest(`http://localhost/api/groups/${groupId}/members`), context)

  expect(response.status).toBe(308)
  expect(response.headers.get('location')).toBe(`/api/messages/group/${groupId}/members`)
})

test('redirects legacy group members POST to the canonical Messenger members route', async () => {
  const response = await POST(new NextRequest(`http://localhost/api/groups/${groupId}/members`, { method: 'POST' }), context)

  expect(response.status).toBe(308)
  expect(response.headers.get('location')).toBe(`/api/messages/group/${groupId}/members`)
})
