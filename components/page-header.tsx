"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, BookOpen, Menu, MessageSquare, Search, User, Users, LogOut, Lock } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Navigation } from "@/components/navigation"
import { SearchModal } from "@/components/search-modal"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PageHeaderProps {
  title?: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    fetchUser()
  }, [])

  return (
    <header className="page-header sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        {/* Left section - Logo and Navigation */}
        <div className="page-header__left flex items-center gap-4 md:gap-6 lg:gap-10">
          <Link href="/" className="page-header__logo flex items-center gap-2 font-bold text-xl">
            <img 
              src="/images/authorsinfo-logo-w-135x45.svg" 
              alt="Author's Info Logo" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Navigation moved next to logo */}
          <div className="page-header__nav flex">
            <Navigation />
          </div>
        </div>

        {/* Right section - Actions and User menu */}
        <div className="page-header__actions flex items-center gap-2">
          {/* Search button that opens modal */}
          <Button variant="ghost" size="icon" className="page-header__search-btn rounded-full" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <Button variant="ghost" size="icon" className="page-header__notifications-btn rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <Button variant="ghost" size="icon" className="page-header__messages-btn rounded-full">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Messages</span>
          </Button>

          {/* User avatar dropdown, only if logged in */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="user-avatar-button rounded-full hover:bg-accent hover:text-accent-foreground p-0">
                  <div className="user-avatar-container relative w-10 h-10 overflow-hidden rounded-full border-2 border-white shadow-md">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        alt={user.user_metadata.full_name || user.email || "User"}
                        src={user.user_metadata.avatar_url}
                        className="user-avatar-image object-cover rounded-full w-10 h-10"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-white text-lg font-bold">
                        {user.user_metadata?.full_name?.[0] || user.email?.[0] || <User className="h-5 w-5" />}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 page-header__dropdown-content">
                <Link href={`/profile/${user.id}`}>
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
                <DropdownMenuSeparator className="page-header__dropdown-separator" />
                <DropdownMenuItem className="page-header__dropdown-item" onClick={async () => {
                  const supabase = createClientComponentClient()
                  await supabase.auth.signOut()
                  window.location.reload()
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading && (
            <Button variant="ghost" size="icon" className="user-avatar-button rounded-full hover:bg-accent hover:text-accent-foreground p-0" onClick={() => router.push("/login")}> 
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-white">
                <Lock className="h-5 w-5" />
              </span>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="page-header__menu-btn rounded-md md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>

      {title && (
        <div className="container mx-auto px-4 max-w-7xl py-6">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      )}

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
