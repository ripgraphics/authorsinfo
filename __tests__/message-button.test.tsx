import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MessageButton } from '@/components/message-button'

const push = jest.fn()

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