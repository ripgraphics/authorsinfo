import { fireEvent, render, screen } from '@testing-library/react'
import { ParticipantDetailsPanel } from '@/components/participant-details-panel'

jest.mock('@/components/ui/avatar', () => ({
  Avatar: () => <span aria-hidden="true" />,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

test('exposes mark unread for direct conversations', () => {
  const onMarkUnread = jest.fn()

  render(
    <ParticipantDetailsPanel
      participant={{ id: 'user-2', name: 'Bob Brown' }}
      canMarkUnread
      onMarkUnread={onMarkUnread}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Mark unread' }))

  expect(onMarkUnread).toHaveBeenCalledTimes(1)
})

test('exposes block participant for direct conversations', () => {
  const onBlock = jest.fn()

  render(
    <ParticipantDetailsPanel
      participant={{ id: 'user-2', name: 'Bob Brown' }}
      canBlock
      onBlock={onBlock}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Block participant' }))

  expect(onBlock).toHaveBeenCalledTimes(1)
})

test('exposes mute state toggle for direct conversations', () => {
  const onToggleMute = jest.fn()

  render(
    <ParticipantDetailsPanel
      participant={{ id: 'user-2', name: 'Bob Brown' }}
      canMute
      onToggleMute={onToggleMute}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Mute conversation' }))

  expect(onToggleMute).toHaveBeenCalledTimes(1)
})

test('exposes archive state toggle for direct conversations', () => {
  const onToggleArchive = jest.fn()

  render(
    <ParticipantDetailsPanel
      participant={{ id: 'user-2', name: 'Bob Brown' }}
      canArchive
      onToggleArchive={onToggleArchive}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Archive conversation' }))

  expect(onToggleArchive).toHaveBeenCalledTimes(1)
})