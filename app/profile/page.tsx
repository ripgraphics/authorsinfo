import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { BookOpen, User, Edit, Camera, BookMarked, Clock, Star } from "lucide-react"

export default function ProfilePage() {
  // In a real app, you would fetch the user data from your database
  const user = {
    id: "1",
    username: "bookworm",
    full_name: "Jane Bookworm",
    bio: "Avid reader and book collector. I love fiction, fantasy, and historical novels.",
    avatar_url: null,
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <PageHeader />

      <main className="flex-1">
        {/* Cover Banner */}
        <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <Button variant="ghost" className="absolute right-4 top-4 bg-black/20 text-white hover:bg-black/30">
            <Camera className="h-4 w-4 mr-2" />
            <span>Add Cover Photo</span>
          </Button>

          <div className="container relative h-full flex items-end pb-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              {/* User Photo */}
              <div className="w-32 h-32 md:w-40 md:h-40 -mt-16 md:mt-0 z-10 rounded-full overflow-hidden border-4 border-white shadow-xl relative group">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.full_name || user.username}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* User Name and Info */}
              <div className="text-center md:text-left text-white">
                <h1 className="text-3xl md:text-4xl font-bold">{user.full_name || user.username}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>0 books read</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    <span>0 friends</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border-b shadow-sm">
          <div className="container py-2">
            <div className="flex justify-between items-center">
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="bg-transparent h-auto p-0 gap-1">
                  <TabsTrigger
                    value="timeline"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none px-4 py-2 rounded-none"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="books"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none px-4 py-2 rounded-none"
                  >
                    Books
                  </TabsTrigger>
                  <TabsTrigger
                    value="friends"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none px-4 py-2 rounded-none"
                  >
                    Friends
                  </TabsTrigger>
                  <TabsTrigger
                    value="photos"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none px-4 py-2 rounded-none"
                  >
                    Photos
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - User Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.bio ? (
                    <div>
                      <p>{user.bio}</p>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No bio available.</div>
                  )}

                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Bio
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reading Challenge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold">0/20</div>
                      <p className="text-sm text-muted-foreground mt-1">books read in 2025</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "0%" }}></div>
                    </div>
                    <Button>Update Challenge</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bookshelves</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <BookMarked className="h-4 w-4 text-blue-600" />
                      <span>Want to Read</span>
                    </div>
                    <span className="text-muted-foreground">0 books</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Currently Reading</span>
                    </div>
                    <span className="text-muted-foreground">0 books</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span>Read</span>
                    </div>
                    <span className="text-muted-foreground">0 books</span>
                  </div>

                  <Separator className="my-2" />

                  <Button variant="outline" className="w-full">
                    <span>View All Bookshelves</span>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Friends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">You haven't added any friends yet.</p>
                    <Button className="mt-4">Find Friends</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Share an update</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.full_name || user.username} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <Input placeholder="What are you reading?" className="flex-1" />
                  </div>
                </CardContent>
                <div className="px-6 py-2 border-t flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>Add Book</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>Rate a Book</span>
                    </Button>
                  </div>
                  <Button size="sm">Post</Button>
                </div>
              </Card>

              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium">No Updates Yet</h3>
                <p className="text-muted-foreground mt-2">
                  Start by adding books to your shelves or rating books you've read.
                </p>
                <div className="flex justify-center gap-4 mt-6">
                  <Button>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Books
                  </Button>
                  <Button variant="outline">
                    <User className="mr-2 h-4 w-4" />
                    Find Friends
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
