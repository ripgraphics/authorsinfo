/**
 * Unit tests for photo viewer delete flow: DB delete and onPhotoDeleted callback.
 * Verifies that when delete succeeds, the parent is notified so the list and count update.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { EnterprisePhotoViewer } from '@/components/photo-gallery/enterprise-photo-viewer'

const mockDeleteResolve = jest.fn().mockResolvedValue({ data: [{ id: 'row-1' }], error: null })

const selectChain = {
  eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
  limit: () => Promise.resolve({ data: [], error: null }),
}
const deleteChain = {
  eq: () => ({
    eq: () => ({
      select: () => mockDeleteResolve(),
    }),
  }),
}

jest.mock('@/lib/supabase/client', () => ({
  supabaseClient: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => selectChain,
      delete: () => deleteChain,
    }),
  },
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

jest.mock('@/lib/auth-utils', () => ({
  isUserAdmin: jest.fn().mockResolvedValue(false),
}))

const defaultPhotos = [
  {
    id: 'photo-id-1',
    url: 'https://example.com/1.jpg',
    alt_text: 'Photo 1',
    created_at: new Date().toISOString(),
  },
]

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  photos: defaultPhotos,
  currentIndex: 0,
  onIndexChange: jest.fn(),
  albumId: 'album-id-1',
  entityId: 'entity-1',
  entityType: 'author' as const,
  isOwner: true,
}

describe('EnterprisePhotoViewer delete photo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteResolve.mockResolvedValue({ data: [{ id: 'row-1' }], error: null })
  })

  it('calls onPhotoDeleted with photo id after successful delete when user confirms', async () => {
    const onPhotoDeleted = jest.fn()
    render(<EnterprisePhotoViewer {...defaultProps} onPhotoDeleted={onPhotoDeleted} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete photo/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete photo/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /delete photo\?/i })).toBeInTheDocument()
    })

    const deleteConfirmButton = screen.getByRole('button', { name: /^delete$/i })
    fireEvent.click(deleteConfirmButton)

    await waitFor(() => {
      expect(mockDeleteResolve).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(onPhotoDeleted).toHaveBeenCalledTimes(1)
      expect(onPhotoDeleted).toHaveBeenCalledWith('photo-id-1')
    })
  })

  it('does not call onPhotoDeleted when Cancel is clicked', async () => {
    const onPhotoDeleted = jest.fn()
    render(<EnterprisePhotoViewer {...defaultProps} onPhotoDeleted={onPhotoDeleted} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete photo/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete photo/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onPhotoDeleted).not.toHaveBeenCalled()
  })

  it('does not call onPhotoDeleted when Supabase delete returns error', async () => {
    mockDeleteResolve.mockResolvedValueOnce({ data: null, error: { message: 'RLS policy' } })
    const onPhotoDeleted = jest.fn()
    render(<EnterprisePhotoViewer {...defaultProps} onPhotoDeleted={onPhotoDeleted} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete photo/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete photo/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(mockDeleteResolve).toHaveBeenCalled()
    })

    expect(onPhotoDeleted).not.toHaveBeenCalled()
  })
})
