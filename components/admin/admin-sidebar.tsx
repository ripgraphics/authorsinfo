"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Book,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Home,
  Layers,
  Library,
  Package,
  Settings,
  Tag,
  User,
  Users,
  Database,
  ImageIcon,
  BarChart3,
  Link2,
} from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    dashboard: true,
    books: false,
    authors: false,
    publishers: false,
    settings: false,
  })

  const toggleExpand = (section: string) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <aside className="h-screen bg-[#121212] text-white fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 shadow-lg w-64">
      <div className="flex items-center gap-2 px-4 h-16 bg-[#121212] border-b border-white/10">
        <div className="text-cyan-400">
          <img 
            src="/images/authorsinfo-logo-w-135x45.svg" 
            alt="Author's Info Logo" 
            className="h-8 w-auto"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <nav className="flex flex-col gap-0.5 px-2 py-4 h-full overflow-y-auto scrollbar-hide">
          <div className="relative">
            <button
              className="flex items-center justify-between w-full gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-white font-medium"
              onClick={() => toggleExpand("dashboard")}
            >
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5" />
                <span className="opacity-100">Dashboard</span>
              </div>
              {expanded.dashboard ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {expanded.dashboard && (
              <div className="pl-9 mt-1 space-y-1">
                <Link
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                    pathname === "/admin" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                  }`}
                  href="/admin"
                >
                  <Layers className="h-4 w-4" />
                  Overview
                </Link>
                <Link
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                    pathname === "/admin/statistics" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                  }`}
                  href="/admin/statistics"
                >
                  <FileText className="h-4 w-4" />
                  Statistics
                </Link>
                <Link
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                    pathname === "/admin/reports" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                  }`}
                  href="/admin/reports"
                >
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400">Content Management</div>

            <div className="relative">
              <button
                className="flex items-center justify-between w-full gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                onClick={() => toggleExpand("books")}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5" />
                  <span className="opacity-100">Books</span>
                </div>
                {expanded.books ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {expanded.books && (
                <div className="pl-9 mt-1 space-y-1">
                  <Link
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                    href="/admin/books"
                  >
                    <Package className="h-4 w-4" />
                    All Books
                  </Link>
                  <Link
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                    href="/admin/books/add"
                  >
                    <Tag className="h-4 w-4" />
                    Add Book
                  </Link>
                  <Link
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                    href="/admin/books/import"
                  >
                    <FileText className="h-4 w-4" />
                    Import Books
                  </Link>
                  <Link
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                    href="/admin/new-books"
                  >
                    <FileText className="h-4 w-4" />
                    New Books
                  </Link>
                  <Link
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                    href="/admin/retrieve-books"
                  >
                    <Library className="h-4 w-4" />
                    Retrieve Books
                  </Link>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                className="flex items-center justify-between w-full gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                onClick={() => toggleExpand("authors")}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  <span className="opacity-100">Authors</span>
                </div>
                {expanded.authors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {expanded.authors && (
                <div className="pl-9 mt-1 space-y-1">
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/authors" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                    }`}
                    href="/admin/authors"
                  >
                    <Users className="h-4 w-4" />
                    All Authors
                  </Link>
                  <Link
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                    href="/admin/authors/add"
                  >
                    <Tag className="h-4 w-4" />
                    Add Author
                  </Link>
                  {/* Added Book-Author Connections link under Authors section */}
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/book-author-connections"
                        ? "bg-white/10 text-white font-medium"
                        : "text-gray-400"
                    }`}
                    href="/admin/book-author-connections"
                  >
                    <Link2 className="h-4 w-4" />
                    Book Connections
                  </Link>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                className="flex items-center justify-between w-full gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                onClick={() => toggleExpand("publishers")}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  <span className="opacity-100">Publishers</span>
                </div>
                {expanded.publishers ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {expanded.publishers && (
                <div className="pl-9 mt-1 space-y-1">
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/publishers" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                    }`}
                    href="/admin/publishers"
                  >
                    <Package className="h-4 w-4" />
                    All Publishers
                  </Link>
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/publishers/add" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                    }`}
                    href="/admin/publishers/add"
                  >
                    <Tag className="h-4 w-4" />
                    Add Publisher
                  </Link>
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/book-publisher-connections"
                        ? "bg-white/10 text-white font-medium"
                        : "text-gray-400"
                    }`}
                    href="/admin/book-publisher-connections"
                  >
                    <Link2 className="h-4 w-4" />
                    Book Connections
                  </Link>
                </div>
              )}
            </div>

            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
              href="/admin/regenerate-covers"
            >
              <ImageIcon className="h-5 w-5" />
              <span>Regenerate Covers</span>
            </Link>
          </div>

          <div className="pt-4">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400">System</div>

            <div className="relative">
              <button
                className="flex items-center justify-between w-full gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 text-gray-400"
                onClick={() => toggleExpand("settings")}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  <span className="opacity-100">Settings</span>
                </div>
                {expanded.settings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {expanded.settings && (
                <div className="pl-9 mt-1 space-y-1">
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/format-types" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                    }`}
                    href="/admin/format-types"
                  >
                    <Database className="h-4 w-4" />
                    Format Types
                  </Link>
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/binding-types" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                    }`}
                    href="/admin/binding-types"
                  >
                    <Database className="h-4 w-4" />
                    Binding Types
                  </Link>
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/image-types" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                    }`}
                    href="/admin/image-types"
                  >
                    <Database className="h-4 w-4" />
                    Image Types
                  </Link>
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/book-genres" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                    }`}
                    href="/admin/book-genres"
                  >
                    <Database className="h-4 w-4" />
                    Book Genres
                  </Link>
                  <Link
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-white/10 ${
                      pathname === "/admin/roles" ? "bg-white/10 text-white font-medium" : "text-gray-400"
                    }`}
                    href="/admin/roles"
                  >
                    <Database className="h-4 w-4" />
                    Roles
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 bg-[#121212]">
        <button
          className="flex items-center justify-between w-full gap-3 rounded-md hover:bg-white/10 p-2 transition-colors"
          type="button"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex shrink-0 overflow-hidden rounded-full h-8 w-8">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-700 text-white">
                AI
              </span>
            </span>
            <div className="text-left">
              <div className="text-sm font-medium">Admin User</div>
              <div className="text-xs text-gray-400">@admin</div>
            </div>
          </div>
          <ChevronUp className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </aside>
  )
}
