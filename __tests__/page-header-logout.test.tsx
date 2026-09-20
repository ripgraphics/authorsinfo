import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PageHeader } from '@/components/page-header'

const push = jest.fn()
const signOut = jest.fn().mockRejectedValue(new Error('Remote logout failed'))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}))
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({ auth: { signOut } }),
}))
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'Maya Miller' }, loading: false }),
}))
jest.mock('@/hooks/use-chat-unread', () => ({ useChatUnreadTotal: () => 0 }))
jest.mock('@/components/friend-request-notification', () => ({ FriendRequestNotification: () => null }))
jest.mock('@/components/navigation', () => ({ Navigation: () => null }))
jest.mock('@/components/search-modal', () => ({ SearchModal: () => null }))
jest.mock('@/components/entity-avatar', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@/components/ui/avatar', () => ({ Avatar: () => <span /> }))
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
  DropdownMenuSeparator: () => null,
}))
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

test('redirects to login even when remote logout fails', async () => {
  window.localStorage.setItem('current-user-data', 'stale')
  window.sessionStorage.setItem('authorsinfo:floating-chat:open', 'true')
  render(<PageHeader />)
  fireEvent.click(screen.getByRole('banner').querySelectorAll('button')[1])
  fireEvent.click(screen.getAllByText('Log out').at(-1) as HTMLElement)

  await waitFor(() => expect(push).toHaveBeenCalledWith('/login'))
  expect(window.localStorage.getItem('current-user-data')).toBeNull()
  expect(window.sessionStorage.getItem('authorsinfo:floating-chat:open')).toBeNull()
})