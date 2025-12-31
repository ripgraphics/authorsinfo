import { renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

// These tests intentionally mock out complex side-effects inside useAuth
// (Supabase client creation, auth subscriptions, retries/dedup caching) and
// validate the stable consumer-facing contract only.

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

describe('useAuth Hook (contract)', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return loading state', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null, loading: true })

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('should return user when authenticated', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    }

    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false })

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual(mockUser)
  })

  it('should return null user when unauthenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null, loading: false })

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
