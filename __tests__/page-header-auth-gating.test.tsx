import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/page-header'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}))
jest.mock('next/image', () => ({ __esModule: true, default: () => <img alt="logo" /> }))
jest.mock('@supabase/ssr', () => ({ createBrowserClient: () => ({ auth: { signOut: jest.fn() } }) }))
jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null, loading: false }) }))
jest.mock('@/hooks/use-chat-unread', () => ({ useChatUnreadTotal: () => 0 }))
jest.mock('@/components/friend-request-notification', () => ({ FriendRequestNotification: () => <button>Friend requests</button> }))
jest.mock('@/components/navigation', () => ({ Navigation: () => null }))
jest.mock('@/components/search-modal', () => ({ SearchModal: () => null }))
jest.mock('@/components/entity-avatar', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@/components/ui/avatar', () => ({ Avatar: () => <span /> }))
jest.mock('@/components/ui/dropdown-menu', () => ({ DropdownMenu: ({ children }: any) => <div>{children}</div>, DropdownMenuTrigger: ({ children }: any) => <>{children}</>, DropdownMenuContent: ({ children }: any) => <div>{children}</div>, DropdownMenuItem: ({ children }: any) => <button>{children}</button>, DropdownMenuSeparator: () => null }))
jest.mock('@/components/ui/sheet', () => ({ Sheet: ({ children }: any) => <div>{children}</div>, SheetContent: ({ children }: any) => <div>{children}</div>, SheetHeader: ({ children }: any) => <div>{children}</div>, SheetTitle: ({ children }: any) => <div>{children}</div> }))

test('hides authenticated friend and chat controls when logged out', () => {
  render(<PageHeader />)

  expect(screen.queryByRole('button', { name: /Open chat/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Friend requests' })).not.toBeInTheDocument()
})