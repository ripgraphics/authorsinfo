"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Building, Search } from "lucide-react"

export default function AdvancedSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("type") || "books")

  // Book search form state
  const [bookTitle, setBookTitle] = useState(searchParams.get("title") || "")
  const [bookAuthor, setBookAuthor] = useState(searchParams.get("author") || "")
  const [isbn10, setIsbn10] = useState(searchParams.get("isbn10") || "")
  const [isbn13, setIsbn13] = useState(searchParams.get("isbn13") || "")
  const [bookLanguage, setBookLanguage] = useState(searchParams.get("language") || "")
  const [publishYear, setPublishYear] = useState(searchParams.get("publishYear") || "")
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [bookFormat, setBookFormat] = useState(searchParams.get("format") || "")

  // Publisher search form state
  const [publisherName, setPublisherName] = useState(searchParams.get("name") || "")
  const [publisherLocation, setPublisherLocation] = useState(searchParams.get("location") || "")
  const [foundedYear, setFoundedYear] = useState(searchParams.get("foundedYear") || "")

  const handleBookSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Build query string
    const params = new URLSearchParams()
    params.set("type", "books")

    if (bookTitle) params.set("title", bookTitle)
    if (bookAuthor) params.set("author", bookAuthor)
    if (isbn10) params.set("isbn10", isbn10)
    if (isbn13) params.set("isbn13", isbn13)
    if (bookLanguage) params.set("language", bookLanguage)
    if (publishYear) params.set("publishYear", publishYear)
    if (minRating) params.set("minRating", minRating)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (bookFormat) params.set("format", bookFormat)

    router.push(`/search/advanced/results?${params.toString()}`)
  }

  const handlePublisherSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Build query string
    const params = new URLSearchParams()
    params.set("type", "publishers")

    if (publisherName) params.set("name", publisherName)
    if (publisherLocation) params.set("location", publisherLocation)
    if (foundedYear) params.set("foundedYear", foundedYear)

    router.push(`/search/advanced/results?${params.toString()}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Advanced Search</h1>
            <p className="text-muted-foreground">Search for books and publishers with specific criteria</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="books" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Books
              </TabsTrigger>
              <TabsTrigger value="publishers" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Publishers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="books" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBookSearch} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="bookTitle">Title</Label>
                        <Input
                          id="bookTitle"
                          placeholder="Book title"
                          value={bookTitle}
                          onChange={(e) => setBookTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bookAuthor">Author</Label>
                        <Input
                          id="bookAuthor"
                          placeholder="Author name"
                          value={bookAuthor}
                          onChange={(e) => setBookAuthor(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="isbn10">ISBN-10</Label>
                        <Input
                          id="isbn10"
                          placeholder="10-digit ISBN"
                          value={isbn10}
                          onChange={(e) => setIsbn10(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="isbn13">ISBN-13</Label>
                        <Input
                          id="isbn13"
                          placeholder="13-digit ISBN"
                          value={isbn13}
                          onChange={(e) => setIsbn13(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bookLanguage">Language</Label>
                        <Input
                          id="bookLanguage"
                          placeholder="English, Spanish, etc."
                          value={bookLanguage}
                          onChange={(e) => setBookLanguage(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="publishYear">Publication Year</Label>
                        <Input
                          id="publishYear"
                          placeholder="2023"
                          value={publishYear}
                          onChange={(e) => setPublishYear(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minRating">Minimum Rating</Label>
                        <Select value={minRating} onValueChange={setMinRating}>
                          <SelectTrigger id="minRating">
                            <SelectValue placeholder="Any rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any rating</SelectItem>
                            <SelectItem value="1">1+ stars</SelectItem>
                            <SelectItem value="2">2+ stars</SelectItem>
                            <SelectItem value="3">3+ stars</SelectItem>
                            <SelectItem value="4">4+ stars</SelectItem>
                            <SelectItem value="4.5">4.5+ stars</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxPrice">Maximum Price</Label>
                        <Input
                          id="maxPrice"
                          placeholder="29.99"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bookFormat">Format</Label>
                        <Select value={bookFormat} onValueChange={setBookFormat}>
                          <SelectTrigger id="bookFormat">
                            <SelectValue placeholder="Any format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any format</SelectItem>
                            <SelectItem value="Hardcover">Hardcover</SelectItem>
                            <SelectItem value="Paperback">Paperback</SelectItem>
                            <SelectItem value="eBook">eBook</SelectItem>
                            <SelectItem value="Audiobook">Audiobook</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        <Search className="h-4 w-4 mr-2" />
                        Search Books
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publishers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Publishers</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePublisherSearch} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="publisherName">Publisher Name</Label>
                        <Input
                          id="publisherName"
                          placeholder="Publisher name"
                          value={publisherName}
                          onChange={(e) => setPublisherName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="publisherLocation">Location</Label>
                        <Input
                          id="publisherLocation"
                          placeholder="City, Country"
                          value={publisherLocation}
                          onChange={(e) => setPublisherLocation(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="foundedYear">Founded Year</Label>
                        <Input
                          id="foundedYear"
                          placeholder="1980"
                          value={foundedYear}
                          onChange={(e) => setFoundedYear(e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        <Search className="h-4 w-4 mr-2" />
                        Search Publishers
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
