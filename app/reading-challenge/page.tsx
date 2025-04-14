import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Trophy, Calendar, Clock, CheckCircle, Edit } from "lucide-react"

export default function ReadingChallengePage() {
  const currentYear = new Date().getFullYear()

  // In a real app, you would fetch this data from your database
  const challenge = {
    year: currentYear,
    target_books: 20,
    books_read: 0,
  }

  const progress = (challenge.books_read / challenge.target_books) * 100

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <PageHeader />

      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{currentYear} Reading Challenge</h1>
            <p className="text-muted-foreground">Track your reading goals for the year</p>
          </div>

          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 mb-2">
                <Trophy className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Your Challenge</CardTitle>
              <CardDescription>
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{currentYear}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold">
                  {challenge.books_read} / {challenge.target_books}
                </div>
                <p className="text-sm text-muted-foreground mt-1">books read</p>
              </div>

              <Progress value={progress} className="h-3" />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold">{challenge.books_read}</div>
                  <p className="text-sm text-muted-foreground">Books Read</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold">{challenge.target_books - challenge.books_read}</div>
                  <p className="text-sm text-muted-foreground">Books To Go</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>Edit Goal</span>
              </Button>
              <Button className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Add Book</span>
              </Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Reading Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average books per month</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pages read</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average rating</span>
                  <span className="font-medium">0</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  <span>Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Complete your reading goals to unlock achievements!</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Books in your challenge</CardTitle>
              <CardDescription>Books you've read this year</CardDescription>
            </CardHeader>
            <CardContent>
              {challenge.books_read > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{/* Books would go here */}</div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No books yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Start adding books to your challenge to track your progress.
                  </p>
                  <Button className="mt-4">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Books
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
