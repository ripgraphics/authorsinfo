import type { Metadata } from "next"
import { ReadingStats } from "@/components/reading-progress/reading-stats"
import { ActivityFeed } from "@/components/reading-progress/activity-feed"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRecentBooks } from "@/app/actions/data"
import { BookCard } from "@/components/book-card"

export const metadata: Metadata = {
  title: "Reading Dashboard | Author's Info",
  description: "Track your reading progress and see what your friends are reading",
}

export default async function ReadingDashboardPage() {
  // Get some recent books to recommend
  const recentBooks = await getRecentBooks(6)

  return (
    <div className="space-y-6">
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight">Reading Dashboard</h1>
        <p className="text-muted-foreground mt-2">Track your reading progress and see what your friends are reading</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Stats */}
        <div className="space-y-6">
          <ReadingStats />

          <Card>
            <CardHeader>
              <CardTitle>Reading Goals</CardTitle>
              <CardDescription>Set and track your reading goals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-6">Reading goals feature coming soon!</p>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Activity */}
        <div className="space-y-6">
          <ActivityFeed type="user" limit={5} />

          <ActivityFeed type="friends" limit={5} />
        </div>

        {/* Right Column - Recommendations */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recommended Books</CardTitle>
              <CardDescription>Books you might enjoy</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="trending">
                <TabsList className="mb-4">
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="similar">Similar to Your Reads</TabsTrigger>
                </TabsList>

                <TabsContent value="trending">
                  <div className="grid grid-cols-2 gap-4">
                    {recentBooks.slice(0, 6).map((book) => (
                      <BookCard
                        key={book.id}
                        id={book.id}
                        title={book.title}
                        author={(book.author && typeof book.author === 'object') ? {
                          id: (book.author as any).id,
                          name: (book.author as any).name,
                          author_image: (book.author as any).author_image
                        } : undefined}
                        coverImageUrl={book.cover_image_url || "/placeholder.svg"}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="similar">
                  <p className="text-center text-muted-foreground py-6">Personalized recommendations coming soon!</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
