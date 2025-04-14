"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-2">
      <Button variant={pathname === "/" ? "default" : "ghost"} asChild>
        <Link href="/">Home</Link>
      </Button>
      <Button variant={pathname.startsWith("/books") ? "default" : "ghost"} asChild>
        <Link href="/books">Books</Link>
      </Button>
      <Button variant={pathname.startsWith("/authors") ? "default" : "ghost"} asChild>
        <Link href="/authors">Authors</Link>
      </Button>
      <Button variant={pathname.startsWith("/publishers") ? "default" : "ghost"} asChild>
        <Link href="/publishers">Publishers</Link>
      </Button>
      <Button variant={pathname.startsWith("/admin") ? "default" : "ghost"} asChild>
        <Link href="/admin/regenerate-covers">Admin</Link>
      </Button>
    </nav>
  )
}
