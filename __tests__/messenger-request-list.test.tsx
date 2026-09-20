import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MessengerRequestList } from '@/components/messenger-request-list'

const request = {
  id: 'request-1',
  conversationId: 'conversation-1',
  requesterId: 'user-1',
  recipientId: 'user-2',
  status: 'pending' as const,
}

test('shows accept and decline actions to the recipient', () => {
  render(
    <MessengerRequestList
      requests={[request]}
      currentUserId="user-2"
      onAccept={jest.fn()}
      onDecline={jest.fn()}
    />
  )

  expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
})

test('shows cancel action to the requester', () => {
  const onCancel = jest.fn()
  render(
    <MessengerRequestList
      requests={[request]}
      currentUserId="user-1"
      onCancel={onCancel}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onCancel).toHaveBeenCalledWith('request-1')
  expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
})

test('suppresses duplicate request actions while an async update is pending', async () => {
  const onAccept = jest.fn(() => new Promise<void>(() => undefined))
  render(
    <MessengerRequestList
      requests={[request]}
      currentUserId="user-2"
      onAccept={onAccept}
    />
  )

  const acceptButton = screen.getByRole('button', { name: 'Accept' })
  await act(async () => {
    fireEvent.click(acceptButton)
    fireEvent.click(acceptButton)
    expect(onAccept).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(acceptButton).toBeDisabled())
  })
})
