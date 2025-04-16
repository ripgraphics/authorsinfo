import { supabaseAdmin } from "@/lib/supabase/server"
import { Book, ShoppingCart, User, ArrowUpRight, Eye, Trash } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getStats() {
  const [{ count: booksCount }, { count: authorsCount }, { count: publishersCount }, { data: recentBooks }] =
    await Promise.all([
      supabaseAdmin.from("books").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("authors").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("publishers").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("books").select("*").order("id", { ascending: false }).limit(5),
    ])

  return {
    booksCount: booksCount || 0,
    authorsCount: authorsCount || 0,
    publishersCount: publishersCount || 0,
    recentBooks: recentBooks || [],
  }
}

export default async function AdminDashboard() {
  const { booksCount, authorsCount, publishersCount, recentBooks } = await getStats()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center">
            <Button variant="ghost">Author&apos;s Info</Button>
            <span className="text-gray-400 mx-2">/</span>
            <Button variant="ghost">Admin</Button>
            <span className="text-gray-400 mx-2">/</span>
            <Button variant="ghost">Dashboard</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Books</h3>
              <div className="bg-gray-100 p-2 rounded-full">
                <Book className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{booksCount}</div>
                <div className="text-xs text-gray-500 mt-1">Total books in database</div>
              </div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +5.2%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Authors</h3>
              <div className="bg-gray-100 p-2 rounded-full">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{authorsCount}</div>
                <div className="text-xs text-gray-500 mt-1">Total authors in database</div>
              </div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +3.8%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Publishers</h3>
              <div className="bg-gray-100 p-2 rounded-full">
                <ShoppingCart className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{publishersCount}</div>
                <div className="text-xs text-gray-500 mt-1">Total publishers in database</div>
              </div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +2.4%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Recent Books</h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Publisher</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            {book.title.charAt(0)}
                          </div>
                          <span className="font-medium">{book.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{book.isbn13 || book.isbn10 || "N/A"}</TableCell>
                      <TableCell>{book.publisher_id || "N/A"}</TableCell>
                      <TableCell>
                        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-600">
                          {book.binding || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Format Distribution</h3>
              <Button variant="outline" size="sm">
                Details
              </Button>
            </div>
            <div className="h-64">
              <div className="w-full h-full flex items-end justify-between">
                {["Paperback", "Hardcover", "eBook", "Audiobook", "Board Book"].map((format, i) => (
                  <div key={format} className="flex flex-col items-center">
                    <div className="w-8 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-400 rounded-t-sm"
                        style={{ height: `${Math.random() * 100 + 50}px` }}
                      ></div>
                    </div>
                    <div className="text-xs mt-2 text-gray-500">{format}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Binding Types</h3>
              <Button variant="ghost" size="sm">
                Overview
              </Button>
            </div>
            <div className="space-y-4">
              {[
                { name: "Paperback", value: 45 },
                { name: "Hardcover", value: 25 },
                { name: "eBook", value: 15 },
                { name: "Audiobook", value: 10 },
                { name: "Other", value: 5 },
              ].map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm">{item.value}</div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-500 mt-8">Author&apos;s Info Admin Dashboard</div>
    </div>
  )
}
