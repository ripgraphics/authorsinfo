import { render, screen } from '@testing-library/react'
import { ConversationRail } from '@/components/conversation-rail'

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

describe('ConversationRail', () => {
  it('shows the rail on mobile when mobile visibility is enabled', () => {
    render(
      <ConversationRail
        items={[]}
        activeConversationId={null}
        onSelect={jest.fn()}
        mobileVisible
      />
    )

    expect(screen.getByRole('complementary')).toHaveClass('block', 'md:block')
  })
})