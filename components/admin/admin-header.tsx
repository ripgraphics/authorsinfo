"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, Search, Settings, Sun, Moon, User as UserIcon, LogOut, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchModal } from "@/components/admin/search-modal"
import { useTheme } from "next-themes"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar } from "@/components/ui/avatar"

export function AdminHeader() {
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, setTheme } = useTheme()
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
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-md border bg-background pl-8 md:w-[240px] lg:w-[440px]"
            onClick={() => setSearchOpen(true)}
            readOnly
          />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User avatar dropdown, only if logged in */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative rounded-full p-0">
                  <Avatar
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.full_name || user.email || "User"}
                    name={user.user_metadata?.full_name || user.email || ""}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/profile/${user.id}`}>
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
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
            <Button variant="ghost" size="icon" className="user-avatar-button rounded-full hover:bg-accent hover:text-accent-foreground p-0" onClick={() => window.location.href = "/login"}>
              <Avatar
                name=""
              />
            </Button>
          )}
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
