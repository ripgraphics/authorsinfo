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

test('uses compact Messenger profile controls instead of full-width actions', () => {
  render(
    <ParticipantDetailsPanel
      participant={{ id: 'user-2', name: 'Bob Brown' }}
    />
  )

  expect(screen.getByRole('button', { name: 'Open profile' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Conversation notifications' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Search conversation' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Mark unread' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Block participant' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Mute conversation' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Archive conversation' })).not.toBeInTheDocument()
})

test('shows the retained moderated history policy for group conversations', () => {
  render(
    <ParticipantDetailsPanel
      participant={{ id: 'group-1', name: 'Readers' }}
      groupTitle="Readers"
      historyPolicy="retained_moderated"
    />
  )

  expect(screen.getByText('History')).toBeInTheDocument()
  expect(screen.getByText('Retained and moderated')).toBeInTheDocument()
})