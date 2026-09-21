import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('the canonical messages route renders one full-page Messenger workspace', () => {
  const source = readFileSync(join(process.cwd(), 'app/messages/page.tsx'), 'utf8')

  expect(source).toContain("import { FloatingChat } from '@/components/floating-chat'")
  expect(source).toContain("import { MessengerInvitationList } from '@/components/messenger-invitation-list'")
  expect(source).toContain('<FloatingChat fullPage initialConversationId={initialConversationId} />')
  expect(source.match(/<FloatingChat\b/g)).toHaveLength(1)
  expect(source).not.toContain('legacy')
  expect(source).not.toContain('DirectMessageList')
})
