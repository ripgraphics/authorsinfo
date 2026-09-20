import { fireEvent, render, screen } from '@testing-library/react'
import { DirectMessageList } from '@/components/direct-message-list'

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('@/components/ui/avatar', () => ({
  Avatar: () => <span aria-hidden="true" />,
}))
jest.mock('@/components/typing-indicator', () => ({
  TypingIndicator: () => null,
}))

test('exposes edit, delete, and reaction callbacks for owned messages', async () => {
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  const onReaction = jest.fn()

  render(
    <DirectMessageList
      messages={[
        {
          id: 'message-1',
          senderId: 'user-1',
          body: 'Hello',
          createdAt: '2026-09-17T12:00:00.000Z',
          deletedAt: null,
          readAt: null,
          readBy: null,
        },
      ]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      onEdit={onEdit}
      onDelete={onDelete}
      onReaction={onReaction}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Edit message' }))
  fireEvent.click(screen.getByRole('button', { name: 'Delete message' }))
  fireEvent.click(screen.getByRole('button', { name: 'React to message' }))

  expect(onEdit).toHaveBeenCalledWith('message-1')
  expect(onDelete).toHaveBeenCalledWith('message-1')
  expect(onReaction).toHaveBeenCalledWith('message-1')
})

test('exposes copy callback for messages from either participant', () => {
  const onCopy = jest.fn()

  render(
    <DirectMessageList
      messages={[
        {
          id: 'message-1',
          senderId: 'user-2',
          body: 'Hello from Bob',
          createdAt: '2026-09-17T12:00:00.000Z',
          deletedAt: null,
          readAt: null,
          readBy: null,
        },
      ]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      onCopy={onCopy}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Copy message' }))

  expect(onCopy).toHaveBeenCalledWith('message-1')
})

test('renders protected inline previews for media attachments', () => {
  render(
    <DirectMessageList
      messages={[{
        id: 'message-media',
        senderId: 'user-1',
        body: 'Shared media',
        createdAt: '2026-09-17T12:00:00.000Z',
        deletedAt: null,
        readAt: null,
        readBy: null,
        conversationId: 'conversation-1',
        attachments: [
          { id: 'image-1', fileName: 'cover.png', mimeType: 'image/png', fileSize: 100 },
          { id: 'audio-1', fileName: 'voice.webm', mimeType: 'audio/webm', fileSize: 200 },
          { id: 'video-1', fileName: 'clip.mp4', mimeType: 'video/mp4', fileSize: 300 },
        ],
      }]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
    />
  )

  expect(screen.getByRole('img', { name: 'cover.png' })).toHaveAttribute(
    'src',
    '/api/messages/direct/conversation-1/attachments?message_id=message-media&attachment_id=image-1'
  )
  expect(document.querySelector('audio')).toHaveAttribute(
    'src',
    '/api/messages/direct/conversation-1/attachments?message_id=message-media&attachment_id=audio-1'
  )
  expect(document.querySelector('video')).toHaveAttribute(
    'src',
    '/api/messages/direct/conversation-1/attachments?message_id=message-media&attachment_id=video-1'
  )
})

test('exposes a load older messages action when history has more pages', () => {
  const onLoadOlder = jest.fn()

  render(
    <DirectMessageList
      messages={[]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      hasMore
      onLoadOlder={onLoadOlder}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Load older messages' }))

  expect(onLoadOlder).toHaveBeenCalledTimes(1)
})

test('exposes a retry action when message history fails', () => {
  const onRetry = jest.fn()

  render(
    <DirectMessageList
      messages={[]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      loadError="Unable to load messages"
      onRetry={onRetry}
    />
  )

  expect(screen.getByText('Unable to load messages')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading messages' }))

  expect(onRetry).toHaveBeenCalledTimes(1)
})

test('exposes report callback for messages from the other participant', () => {
  const onReport = jest.fn()

  render(
    <DirectMessageList
      messages={[
        {
          id: 'message-2',
          senderId: 'user-2',
          body: 'Please report me',
          createdAt: '2026-09-17T12:00:00.000Z',
          deletedAt: null,
          readAt: null,
          readBy: null,
        },
      ]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      onReport={onReport}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Report message' }))

  expect(onReport).toHaveBeenCalledWith('message-2')
})

test('exposes reply callback for non-deleted messages', () => {
  const onReply = jest.fn()

  render(
    <DirectMessageList
      messages={[{
        id: 'message-3',
        senderId: 'user-2',
        body: 'Reply to this',
        createdAt: '2026-09-17T12:00:00.000Z',
        deletedAt: null,
        readAt: null,
        readBy: null,
      }]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      onReply={onReply}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Reply to message' }))

  expect(onReply).toHaveBeenCalledWith('message-3')
})

test('renders persisted reply context from loaded message history', () => {
  render(
    <DirectMessageList
      messages={[
        {
          id: 'message-1',
          senderId: 'user-2',
          body: 'Original message',
          createdAt: '2026-09-17T12:00:00.000Z',
          deletedAt: null,
          readAt: null,
          readBy: null,
        },
        {
          id: 'message-2',
          senderId: 'user-1',
          body: 'My reply',
          createdAt: '2026-09-17T12:01:00.000Z',
          deletedAt: null,
          readAt: null,
          readBy: null,
          replyToMessageId: 'message-1',
        },
      ]}
      currentUserId="user-1"
      participant={{ name: 'Bob Brown' }}
      typingUserNames={[]}
    />
  )

  expect(screen.getAllByText('Original message')).toHaveLength(2)
  expect(screen.getByText('Replying to message')).toBeInTheDocument()
})

test('exposes forward callback for non-deleted messages', () => {
  const onForward = jest.fn()

  render(
    <DirectMessageList
      messages={[{
        id: 'message-4',
        senderId: 'user-2',
        body: 'Forward this',
        createdAt: '2026-09-17T12:00:00.000Z',
        deletedAt: null,
        readAt: null,
        readBy: null,
      }]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      onForward={onForward}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Forward message' }))

  expect(onForward).toHaveBeenCalledWith('message-4')
})

test('exposes pin callback and pinned state for messages', () => {
  const onTogglePin = jest.fn()

  render(
    <DirectMessageList
      messages={[{
        id: 'message-5', senderId: 'user-2', body: 'Pin this',
        createdAt: '2026-09-17T12:00:00.000Z', deletedAt: null, readAt: null, readBy: null,
      }]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      pinnedMessageIds={new Set(['message-5'])}
      onTogglePin={onTogglePin}
    />
  )

  expect(screen.getByText('Pinned')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Unpin message' }))
  expect(onTogglePin).toHaveBeenCalledWith('message-5')
})

test('exposes delete for me callback for non-deleted messages', () => {
  const onDeleteForMe = jest.fn()

  render(
    <DirectMessageList
      messages={[{
        id: 'message-6', senderId: 'user-2', body: 'Delete for me',
        createdAt: '2026-09-17T12:00:00.000Z', deletedAt: null, readAt: null, readBy: null,
      }]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      onDeleteForMe={onDeleteForMe}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Delete message for me' }))
  expect(onDeleteForMe).toHaveBeenCalledWith('message-6')
})

test('renders persisted mention metadata', () => {
  render(
    <DirectMessageList
      messages={[{
        id: 'message-7', senderId: 'user-1', body: 'Hello @Bob',
        createdAt: '2026-09-17T12:00:00.000Z', deletedAt: null, readAt: null, readBy: null,
        mentionUserIds: ['user-2'],
      }]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
    />
  )

  expect(screen.getByText('Mentioned users')).toBeInTheDocument()
})

test('renders an unavailable conversation state with an inbox escape', () => {
  const onBackToInbox = jest.fn()

  render(
    <DirectMessageList
      messages={[]}
      currentUserId="user-1"
      participant={null}
      typingUserNames={[]}
      conversationUnavailable
      onBackToInbox={onBackToInbox}
    />
  )

  expect(screen.getByText('This conversation is unavailable.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Back to inbox' }))
  expect(onBackToInbox).toHaveBeenCalledTimes(1)
})
