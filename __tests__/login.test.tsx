import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/login/page'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

const mockSignInWithPassword = jest.fn()

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
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
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null })
    // Mock fetch for user list (useEffect)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users: [] }),
    })
  })

  it('renders login form', async () => {
    render(<LoginPage />)

    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
  it('updates input fields', async () => {
    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('toggles password visibility', async () => {
    render(<LoginPage />)

    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const toggleButton = screen.getByRole('button', { name: /show password|hide password/i })

    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('navigates away from login immediately after a successful test-user login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'sam-id',
          email: 'sam.smith@authorsinfo.com',
          name: 'Sam Smith',
        },
      ],
    })

    render(<LoginPage />)

    const loginButton = await screen.findByRole('button', { name: 'Login as Sam Smith' })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'sam.smith@authorsinfo.com',
        password: 'password123',
      })
      expect(mockReplace).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
