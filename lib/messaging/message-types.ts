export interface MessengerMessage {
  id: string
  senderId: string
  body: string
  createdAt: string
  deletedAt: string | null
  readAt: string | null
  readBy: string | null
  conversationId?: string
  replyToMessageId?: string | null
  mentionUserIds?: string[]
  attachments?: MessengerAttachment[]
}

export interface MessengerAttachment {
  id: string
  fileName: string
  mimeType: string
  fileSize: number
}

export interface DirectMessageRecord {
  id: string
  sender_id: string
  body: string
  created_at: string
  deleted_at?: string | null
  read_at?: string | null
  read_by?: string | null
  conversation_id?: string | null
  reply_to_message_id?: string | null
  mention_user_ids?: string[] | null
  attachments?: MessengerAttachmentRecord[] | null
}

export interface MessengerAttachmentRecord {
  id: string
  file_name: string
  mime_type: string
  file_size: number
}

export interface GroupMessageRecord {
  id: string
  user_id: string | null
  message: string | null
  created_at: string | null
}

export function appendUniqueMessage(
  messages: MessengerMessage[],
  message: MessengerMessage
): MessengerMessage[] {
  return messages.some((item) => item.id === message.id) ? messages : [...messages, message]
}

export function normalizeDirectMessage(message: DirectMessageRecord): MessengerMessage {
  return {
    id: message.id,
    senderId: message.sender_id,
    body: message.body,
    createdAt: message.created_at,
    deletedAt: message.deleted_at ?? null,
    readAt: message.read_at ?? null,
    readBy: message.read_by ?? null,
    ...(message.conversation_id !== undefined
      ? { conversationId: message.conversation_id ?? undefined }
      : {}),
    ...(message.reply_to_message_id !== undefined
      ? { replyToMessageId: message.reply_to_message_id ?? null }
      : {}),
    ...(message.mention_user_ids !== undefined
      ? { mentionUserIds: message.mention_user_ids ?? [] }
      : {}),
    ...(message.attachments
      ? {
          attachments: message.attachments.map((attachment) => ({
            id: attachment.id,
            fileName: attachment.file_name,
            mimeType: attachment.mime_type,
            fileSize: attachment.file_size,
          })),
        }
      : {}),
  }
}

export function normalizeGroupMessage(message: GroupMessageRecord): MessengerMessage {
  return {
    id: message.id,
    senderId: message.user_id ?? '',
    body: message.message ?? '',
    createdAt: message.created_at ?? new Date(0).toISOString(),
    deletedAt: null,
    readAt: null,
    readBy: null,
  }
}
