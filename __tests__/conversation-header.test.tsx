import { fireEvent, render, screen } from '@testing-library/react'
import { ConversationHeader } from '@/components/conversation-header'

jest.mock('@/components/ui/avatar', () => ({
  Avatar: () => <span aria-hidden="true" />,
}))

jest.mock('@/components/ui/icon-button', () => ({
  IconButton: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button type="button" aria-label={label} onClick={onClick} />
  ),
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div role="menu">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode
    onSelect?: () => void
  }) => (
    <button type="button" role="menuitem" onClick={onSelect}>
      {children}
    </button>
  ),
}))

test('exposes reconnect action when the conversation channel is unavailable', () => {
  const onReconnect = jest.fn()

  render(
    <ConversationHeader
      participant={{ name: 'Bob Brown' }}
      connectionLabel="Connection lost"
      onReconnect={onReconnect}
    />
  )

  expect(screen.getByText('Connection lost')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Reconnect chat' }))

  expect(onReconnect).toHaveBeenCalledTimes(1)
})

test('exposes conversation actions in the header menu', () => {
  const onMarkUnread = jest.fn()
  const onBlock = jest.fn()

  render(
    <ConversationHeader
      participant={{ name: 'Bob Brown' }}
      onMarkUnread={onMarkUnread}
      onBlock={onBlock}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Conversation actions' }))
  fireEvent.click(screen.getByRole('menuitem', { name: 'Mark unread' }))
  fireEvent.click(screen.getByRole('button', { name: 'Conversation actions' }))
  fireEvent.click(screen.getByRole('menuitem', { name: 'Block participant' }))

  expect(onMarkUnread).toHaveBeenCalledTimes(1)
  expect(onBlock).toHaveBeenCalledTimes(1)
})

test('does not render call controls without approved call callbacks', () => {
  render(<ConversationHeader participant={{ name: 'Bob Brown' }} />)

  expect(screen.queryByRole('button', { name: 'Audio call' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Video call' })).not.toBeInTheDocument()
})

test('exposes mute and archive conversation actions', () => {
  const onToggleMute = jest.fn()
  const onToggleArchive = jest.fn()

  render(
    <ConversationHeader
      participant={{ name: 'Bob Brown' }}
      isMuted
      onToggleMute={onToggleMute}
      isArchived={false}
      onToggleArchive={onToggleArchive}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Conversation actions' }))
  fireEvent.click(screen.getByRole('menuitem', { name: 'Unmute conversation' }))
  fireEvent.click(screen.getByRole('button', { name: 'Conversation actions' }))
  fireEvent.click(screen.getByRole('menuitem', { name: 'Archive conversation' }))

  expect(onToggleMute).toHaveBeenCalledTimes(1)
  expect(onToggleArchive).toHaveBeenCalledTimes(1)
})