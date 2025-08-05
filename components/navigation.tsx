"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"


export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="main-navigation flex items-center gap-2">
      <Button variant={pathname === "/" ? "default" : "ghost"} asChild className="nav-home-button">
        <Link href="/">Home</Link>
      </Button>
      <Button variant={pathname.startsWith("/books") ? "default" : "ghost"} asChild className="nav-books-button">
        <Link href="/books">Books</Link>
      </Button>
      <Button variant={pathname.startsWith("/authors") ? "default" : "ghost"} asChild className="nav-authors-button">
        <Link href="/authors">Authors</Link>
      </Button>
      <Button variant={pathname.startsWith("/publishers") ? "default" : "ghost"} asChild className="nav-publishers-button">
        <Link href="/publishers">Publishers</Link>
      </Button>
      <Button variant={pathname.startsWith("/events") ? "default" : "ghost"} asChild className="nav-events-button">
        <Link href="/events">Events</Link>
      </Button>
      <Button variant={pathname.startsWith("/admin") ? "default" : "ghost"} asChild className="nav-admin-button">
        <Link href="/admin">Admin</Link>
      </Button>
      <Button variant={pathname.startsWith("/reading-dashboard") ? "default" : "ghost"} asChild className="nav-reading-dashboard-button">
        <Link href="/reading-dashboard">Reading Dashboard</Link>
      </Button>

    </nav>
  )
}
