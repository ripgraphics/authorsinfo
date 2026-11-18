import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DiscussionPage from '@/app/discussions/[id]/page'
import { getDiscussionById } from '@/app/actions/data'

jest.mock('@/app/actions/data', () => ({
  getDiscussionById: jest.fn(),
}))

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { title: 'A Supabase discussion', content: 'Old data source' },
            error: null,
          }),
        }),
      }),
    }),
  },
}))

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

const mockGetDiscussionById = jest.mocked(getDiscussionById)

describe('Discussion detail page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loads the discussion through the Convex-backed action', async () => {
    mockGetDiscussionById.mockResolvedValue({
      title: 'A Convex discussion',
      content: 'Loaded from the existing server action',
    })

    const page = await DiscussionPage({
      params: Promise.resolve({ id: 'discussion-1' }),
    })

    render(page)

    expect(mockGetDiscussionById).toHaveBeenCalledWith('discussion-1')
    expect(screen.getByText('A Convex discussion')).toBeInTheDocument()
    expect(screen.getByText('Loaded from the existing server action')).toBeInTheDocument()
  })
})
