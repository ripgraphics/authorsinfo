export function getDirectMessengerRoute(conversationId: string): string {
  return `/messages/direct/${encodeURIComponent(conversationId)}`
}

export function getMessengerInboxRoute(): string {
  return '/messages'
}
