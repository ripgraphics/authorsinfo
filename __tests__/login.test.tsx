import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/login/page'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

const mockSignInWithPassword = jest.fn()

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
  setPendingToast: jest.fn(),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ user: null, loading: false })),
}))

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}))

describe('LoginPage', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  const mockRefresh = jest.fn()
  const mockToast = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      refresh: mockRefresh,
    })
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
    ;(useAuth as jest.Mock).mockReturnValue({ user: null, loading: false })
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null })
    // Mock fetch for user list (useEffect)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users: [] }),
    })
  })

  it('renders login form', async () => {
    render(<LoginPage />)

    expect(await screen.findByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(await screen.findByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
  it('updates input fields', async () => {
    render(<LoginPage />)

    const emailInput = await screen.findByPlaceholderText('Enter your email')
    const passwordInput = await screen.findByPlaceholderText('Enter your password')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('toggles password visibility', async () => {
    render(<LoginPage />)

    const passwordInput = await screen.findByPlaceholderText('Enter your password')
    const toggleButton = await screen.findByRole('button', { name: /show password|hide password/i })

    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('waits for the server session before redirecting after a successful test-user login', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'sam-id',
            email: 'sam.smith@authorsinfo.com',
            name: 'Sam Smith',
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'sam-id', name: 'Sam Smith' } }),
      })

    render(<LoginPage />)

    const loginButton = await screen.findByRole('button', { name: 'Login as Sam Smith' })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'sam.smith@authorsinfo.com',
        password: 'password123',
      })
      expect(global.fetch).toHaveBeenCalledWith('/api/auth-users', expect.objectContaining({ method: 'POST' }))
      expect(mockReplace).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('redirects an already authenticated user and explains why', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'sam-id', permalink: 'sam.smith' },
      loading: false,
    })
    window.history.pushState({}, '', '/login?next=%2Fbooks')

    render(<LoginPage />)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Already signed in',
        description: 'You are already logged in.',
      })
      expect(mockReplace).toHaveBeenCalledWith('/profile/sam.smith')
    })
  })
})
