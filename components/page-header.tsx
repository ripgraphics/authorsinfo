'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Bell,
  BookOpen,
  Menu,
  MessageSquare,
  Search,
  User,
  Users,
  LogOut,
  Lock,
  UserPlus,
  Calendar,
  Settings,
  BarChart3,
} from 'lucide-react'
import { FriendRequestNotification } from './friend-request-notification'
import { Avatar } from '@/components/ui/avatar'
import { Navigation } from '@/components/navigation'
import { SearchModal } from '@/components/search-modal'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentUserAvatar, useCurrentUserName } from '@/components/user-avatar'
import { getProfileUrlFromUser } from '@/lib/utils/profile-url-client'
import { usePathname } from 'next/navigation'

interface PageHeaderProps {
  title?: string
  description?: string
  children?: React.ReactNode
}

export function PageHeaderHeading({ children }: { children?: React.ReactNode }) {
  return <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading } = useAuth()
  const currentUserAvatar = useCurrentUserAvatar()
  const currentUserName = useCurrentUserName()

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header
      className="page-header sticky top-0 z-50 w-full border-b bg-background backdrop-blur-sm supports-[backdrop-filter]:bg-background/95"
      style={{ backgroundColor: 'hsl(var(--background))' }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        {/* Left section - Logo and Navigation */}
        <div className="page-header__left flex items-center gap-4 md:gap-6 lg:gap-10">
          <Link href="/" className="page-header__logo flex items-center gap-2 font-bold text-xl">
            <Image
              src="/images/authorsinfo-logo-b-135x45.svg"
              alt="Author's Info Logo"
              width={135}
              height={45}
              className="h-8 w-auto"
            />
          </Link>

          {/* Navigation moved next to logo - hidden on mobile */}
          <div className="page-header__nav hidden md:flex">
            <Navigation />
          </div>
        </div>

        {/* Right section - Actions and User menu */}
        <div className="page-header__actions flex items-center gap-2">
          {/* Search button that opens modal - hidden on mobile, available in mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="page-header__search-btn hidden sm:flex rounded-full"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <FriendRequestNotification />

          <Button
            variant="ghost"
            size="icon"
            className="page-header__messages-btn hidden sm:flex rounded-full"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Messages</span>
          </Button>

          {/* User avatar dropdown, only if logged in */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="user-avatar-button rounded-full hover:bg-accent hover:text-accent-foreground p-0"
                >
                  <Avatar
                    src={currentUserAvatar || undefined}
                    alt={currentUserName || 'User'}
                    name={currentUserName || ''}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 page-header__dropdown-content bg-popover"
              >
                <Link href={getProfileUrlFromUser(user)}>
                  <DropdownMenuItem className="page-header__dropdown-item">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/users">
                  <DropdownMenuItem className="page-header__dropdown-item">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Users</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/bookshelves">
                  <DropdownMenuItem className="page-header__dropdown-item">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>My Books</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/friends">
                  <DropdownMenuItem className="page-header__dropdown-item">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Friends</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/friend-requests">
                  <DropdownMenuItem className="page-header__dropdown-item">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Friend Requests</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="page-header__dropdown-separator" />
                <Link href="/events">
                  <DropdownMenuItem className="page-header__dropdown-item">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Events</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/reading-dashboard">
                  <DropdownMenuItem className="page-header__dropdown-item">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Reading Dashboard</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin">
                  <DropdownMenuItem className="page-header__dropdown-item">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="page-header__dropdown-separator" />
                <DropdownMenuItem className="page-header__dropdown-item" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !loading && (
              <Button
                variant="ghost"
                size="icon"
                className="user-avatar-button rounded-full hover:bg-accent hover:text-accent-foreground p-0"
                onClick={() => router.push('/login')}
              >
                <Avatar name="" />
              </Button>
            )
          )}

          <Button
            variant="ghost"
            size="icon"
            className="page-header__menu-btn rounded-md md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>

      {title && (
        <div className="container mx-auto px-4 max-w-7xl py-6">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </div>
      )}

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-background">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-6">
            {/* Mobile Navigation Links */}
            <nav className="flex flex-col gap-2">
              <Button
                variant={pathname === '/' ? 'default' : 'ghost'}
                asChild
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/">Home</Link>
              </Button>
              <Button
                variant={pathname.startsWith('/books') ? 'default' : 'ghost'}
                asChild
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/books">Books</Link>
              </Button>
              <Button
                variant={pathname.startsWith('/authors') ? 'default' : 'ghost'}
                asChild
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/authors">Authors</Link>
              </Button>
              <Button
                variant={pathname.startsWith('/publishers') ? 'default' : 'ghost'}
                asChild
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/publishers">Publishers</Link>
              </Button>
            </nav>

            <div className="border-t pt-4">
              {/* Mobile Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setSearchOpen(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Button>
              </div>

              {/* User Menu in Mobile */}
              {!loading && user && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link
                        href={getProfileUrlFromUser(user)}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/users" onClick={() => setMobileMenuOpen(false)}>
                        <Users className="mr-2 h-4 w-4" />
                        Users
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/bookshelves" onClick={() => setMobileMenuOpen(false)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        My Books
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/friends" onClick={() => setMobileMenuOpen(false)}>
                        <Users className="mr-2 h-4 w-4" />
                        Friends
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/friend-requests" onClick={() => setMobileMenuOpen(false)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Friend Requests
                      </Link>
                    </Button>
                    <div className="border-t mt-2 pt-2">
                      <Button variant="ghost" asChild className="w-full justify-start">
                        <Link href="/events" onClick={() => setMobileMenuOpen(false)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Events
                        </Link>
                      </Button>
                      <Button variant="ghost" asChild className="w-full justify-start">
                        <Link href="/reading-dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Reading Dashboard
                        </Link>
                      </Button>
                      <Button variant="ghost" asChild className="w-full justify-start">
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Admin
                        </Link>
                      </Button>
                    </div>
                    <div className="border-t mt-2 pt-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive"
                        onClick={() => {
                          handleSignOut()
                          setMobileMenuOpen(false)
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
