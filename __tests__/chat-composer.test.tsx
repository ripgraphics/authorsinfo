import { fireEvent, render, screen } from '@testing-library/react'
import { ChatComposer } from '@/components/chat-composer'

test('inserts a selected emoji into the draft', () => {
  render(
    <ChatComposer
      conversationId="conversation-1"
      onSend={jest.fn()}
      emojiOptions={['😀']}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Open emoji picker' }))
  fireEvent.click(screen.getByRole('button', { name: 'Insert 😀' }))

  expect(screen.getByRole('textbox')).toHaveValue('😀')
})

test('passes a selected GIF to the composer media callback', async () => {
  const onGifSelected = jest.fn()
  render(
    <ChatComposer
      conversationId="conversation-1"
      onSend={jest.fn()}
      gifSearch={jest.fn().mockResolvedValue([
        { id: 'gif-1', title: 'Wave', url: 'https://cdn.example/wave.gif' },
      ])}
      onGifSelected={onGifSelected}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Open GIF picker' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Insert GIF Wave' }))

  expect(onGifSelected).toHaveBeenCalledWith({
    id: 'gif-1',
    title: 'Wave',
    url: 'https://cdn.example/wave.gif',
  })
})

test('passes a selected sticker to the composer media callback', async () => {
  const onStickerSelected = jest.fn()
  render(
    <ChatComposer
      conversationId="conversation-1"
      onSend={jest.fn()}
      stickerSearch={jest.fn().mockResolvedValue([
        { id: 'sticker-1', title: 'Hello', url: 'https://cdn.example/hello.webp' },
      ])}
      onStickerSelected={onStickerSelected}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Open sticker picker' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Insert sticker Hello' }))

  expect(onStickerSelected).toHaveBeenCalledWith({
    id: 'sticker-1',
    title: 'Hello',
    url: 'https://cdn.example/hello.webp',
  })
})

test('exposes a voice note control when recording is enabled', () => {
  render(
    <ChatComposer
      conversationId="conversation-1"
      onSend={jest.fn()}
      onVoiceNoteSelected={jest.fn()}
    />
  )

  expect(screen.getByRole('button', { name: 'Record voice message' })).toBeInTheDocument()
})

test('sends with Enter but preserves a newline with Shift+Enter', () => {
  const onSend = jest.fn().mockReturnValue(true)
  render(
    <ChatComposer
      conversationId="conversation-1"
      onSend={onSend}
    />
  )

  const textbox = screen.getByRole('textbox')
  fireEvent.change(textbox, { target: { value: 'hello' } })
  fireEvent.keyDown(textbox, { key: 'Enter', shiftKey: true })
  expect(onSend).not.toHaveBeenCalled()
  expect(textbox).toHaveValue('hello')

  fireEvent.keyDown(textbox, { key: 'Enter', shiftKey: false })
  expect(onSend).toHaveBeenCalledWith('hello')
})