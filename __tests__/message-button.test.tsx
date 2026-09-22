import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MessageButton } from '@/components/message-button'

const push = jest.fn()

beforeEach(() => {
  push.mockReset()
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

test('creates and opens a direct conversation when no callback override is provided', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'conversation-1' }),
  }) as jest.MockedFunction<typeof fetch>

  render(<MessageButton targetUserId="user-2" />)
  fireEvent.click(screen.getByRole('button', { name: 'Message' }))

  await waitFor(() => expect(push).toHaveBeenCalledWith('/messages/direct/conversation-1'))
  expect(global.fetch).toHaveBeenCalledWith('/api/messages/direct', expect.objectContaining({ method: 'POST' }))
})

test('opens the compact floating conversation for a user profile', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'conversation-2' }),
  }) as jest.MockedFunction<typeof fetch>
  const openChat = jest.fn()
  const openFriend = jest.fn()
  window.addEventListener('authorsinfo:open-floating-chat', openChat)
  window.addEventListener('authorsinfo:open-floating-friend', openFriend)

  render(<MessageButton targetUserId="user-2" openInFloatingChat floatingParticipantName="User Two" floatingParticipantAvatarUrl="/user-two.webp" />)
  fireEvent.click(screen.getByRole('button', { name: 'Message' }))

  await waitFor(() => expect(openFriend).toHaveBeenCalledTimes(2))
  expect(openChat).not.toHaveBeenCalled()
  expect((openFriend.mock.calls[0][0] as CustomEvent).detail).toEqual({
    friendId: 'user-2',
    friendName: 'User Two',
    friendAvatarUrl: '/user-two.webp',
  })
  expect((openFriend.mock.calls[1][0] as CustomEvent).detail).toEqual({
    conversationId: 'conversation-2',
    friendId: 'user-2',
    friendName: 'User Two',
    friendAvatarUrl: '/user-two.webp',
  })
  expect(push).not.toHaveBeenCalled()
  window.removeEventListener('authorsinfo:open-floating-chat', openChat)
  window.removeEventListener('authorsinfo:open-floating-friend', openFriend)
})