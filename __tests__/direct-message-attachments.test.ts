/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/messages/direct/[id]/attachments/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn((error: unknown) =>
    NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  ),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const otherUserId = '22222222-2222-4222-8222-222222222222'
const conversationId = '33333333-3333-4333-8333-333333333333'
const messageId = '44444444-4444-4444-8444-444444444444'
const attachmentId = '55555555-5555-4555-8555-555555555555'
const mockFrom = jest.fn()
const mockStorage = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

function storageBucket() {
  return {
    upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
    download: jest.fn().mockResolvedValue({ data: new ArrayBuffer(8), error: null }),
  }
}

let conversations: ReturnType<typeof query>
let messages: ReturnType<typeof query>
let attachments: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({
    data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId },
    error: null,
  })
  messages = query({ data: { id: messageId }, error: null })
  attachments = query({
    data: {
      id: attachmentId,
      message_id: messageId,
      file_name: 'photo.png',
      mime_type: 'image/png',
      file_size: 1024,
      storage_path: `${conversationId}/${messageId}/photo.png`,
    },
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    if (table === 'direct_conversation_messages') return messages
    if (table === 'direct_message_attachments') return attachments
    throw new Error(`Unexpected table ${table}`)
  })
  mockStorage.mockImplementation(() => storageBucket())
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: {
      user: { id: userId },
      supabase: { from: mockFrom, storage: { from: mockStorage } },
    },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = { params: Promise.resolve({ id: conversationId }) }

test('lists attachments for an authorized conversation', async () => {
  const response = await GET(
    new NextRequest(
      `http://localhost/api/messages/direct/${conversationId}/attachments?message_id=${messageId}`
    ),
    context
  )

  expect(response.status).toBe(200)
  expect(attachments.eq).toHaveBeenCalledWith('message_id', messageId)
})

test('downloads an attachment only after validating its message', async () => {
  const response = await GET(
    new NextRequest(
      `http://localhost/api/messages/direct/${conversationId}/attachments?message_id=${messageId}&attachment_id=${attachmentId}`
    ),
    context
  )

  expect(response.status).toBe(200)
  expect(mockStorage).toHaveBeenCalledWith('direct-message-attachments')
  expect(response.headers.get('Content-Type')).toBe('image/png')
})

test('rejects attachment requests without a message id', async () => {
  const response = await GET(
    new NextRequest(`http://localhost/api/messages/direct/${conversationId}/attachments`),
    context
  )

  expect(response.status).toBe(400)
  expect(mockFrom).not.toHaveBeenCalledWith('direct_message_attachments')
})

test('denies non-participants from listing attachments', async () => {
  conversations.maybeSingle.mockResolvedValue({ data: null, error: null })

  const response = await GET(
    new NextRequest(
      `http://localhost/api/messages/direct/${conversationId}/attachments?message_id=${messageId}`
    ),
    context
  )

  expect(response.status).toBe(403)
  expect(mockFrom).not.toHaveBeenCalledWith('direct_message_attachments')
})

test('rejects unsupported upload types before storage', async () => {
  const form = new FormData()
  form.append('message_id', messageId)
  form.append('file', new File(['not an image'], 'payload.exe', { type: 'application/x-msdownload' }))

  const response = await POST(
    new NextRequest(`http://localhost/api/messages/direct/${conversationId}/attachments`, {
      method: 'POST',
      body: form,
    }),
    context
  )

  expect(response.status).toBe(400)
  expect(mockStorage).not.toHaveBeenCalled()
})

test('rejects cross-origin upload requests before storage', async () => {
  const form = new FormData()
  form.append('message_id', messageId)
  form.append('file', new File(['content'], 'photo.png', { type: 'image/png' }))

  const response = await POST(
    new NextRequest(`http://localhost/api/messages/direct/${conversationId}/attachments`, {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
      body: form,
    }),
    context
  )

  expect(response.status).toBe(403)
  expect(mockStorage).not.toHaveBeenCalled()
})

test('denies uploads for non-participants before reading form data', async () => {
  conversations.maybeSingle.mockResolvedValue({ data: null, error: null })
  const request = new NextRequest(
    `http://localhost/api/messages/direct/${conversationId}/attachments`,
    { method: 'POST', body: new FormData() }
  )

  const response = await POST(request, context)

  expect(response.status).toBe(403)
  expect(mockStorage).not.toHaveBeenCalled()
})
