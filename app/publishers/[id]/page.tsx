import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Globe, Mail, Phone, MapPin, Calendar, Pencil } from "lucide-react"
import { supabaseAdmin } from "@/lib/supabase"
import type { Publisher } from "@/types/database"

interface PublisherPageProps {
  params: {
    id: string
  }
}

async function getPublisher(id: string) {
  try {
    const { data: publisher, error } = await supabaseAdmin
      .from("publishers")
      .select(`
        *,
        cover_image:cover_image_id(id, url, alt_text),
        publisher_image:publisher_image_id(id, url, alt_text),
        country_details:country_id(id, name, code)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching publisher:", error)
      return null
    }

    return publisher as Publisher
  } catch (error) {
    console.error("Unexpected error fetching publisher:", error)
    return null
  }
}

async function getPublisherBooks(publisherId: string) {
  const { data: books, error } = await supabaseAdmin
    .from("books")
    .select(`
      id,
      title,
      cover_image:cover_image_id(id, url, alt_text),
      original_image_url,
      author_id,
      authors:author_id(id, name),
      binding_type:binding_type_id(id, name),
      format_type:format_type_id(id, name)
    `)
    .eq("publisher_id", publisherId)
    .order("title")
    .limit(12)

  if (error) {
    console.error("Error fetching publisher books:", error)
    return []
  }

  return books.map((book) => ({
    ...book,
    cover_image_url: book.cover_image?.url || book.original_image_url || null,
    author_name: book.authors?.name || "Unknown Author",
    binding: book.binding_type?.name || book.binding || null,
    format: book.format_type?.name || book.format || null,
  }))
}

export default async function PublisherPage({ params }: PublisherPageProps) {
  const publisher = await getPublisher(params.id)

  if (!publisher) {
    notFound()
  }

  const books = await getPublisherBooks(params.id)

  // Determine which image to use
  const coverImageUrl = publisher.cover_image?.url || "/placeholder.svg?key=w79j2"
  const publisherImageUrl = publisher.publisher_image?.url || publisher.logo_url || "/placeholder.svg?key=z0ewa"

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1">
        {/* Cover Image */}
        <div className="relative w-full h-48 md:h-64 lg:h-80 bg-muted">
          <Image
            src={coverImageUrl || "/placeholder.svg"}
            alt={`${publisher.name} cover`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <div className="container py-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Publisher Info */}
            <div className="md:w-1/3 lg:w-1/4 space-y-4">
              <div className="relative w-32 h-32 mx-auto md:mx-0 -mt-16 md:-mt-20 z-10 rounded-lg overflow-hidden border-4 border-background shadow-md">
                <Image
                  src={publisherImageUrl || "/placeholder.svg"}
                  alt={publisher.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold">{publisher.name}</h1>
                {publisher.founded_year && (
                  <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-1 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>Founded in {publisher.founded_year}</span>
                  </p>
                )}
              </div>

              <Card>
                <CardContent className="p-4 space-y-3">
                  {publisher.website && (
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Website</p>
                        <a
                          href={
                            publisher.website.startsWith("http") ? publisher.website : `https://${publisher.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {publisher.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {publisher.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <a href={`mailto:${publisher.email}`} className="text-sm text-blue-600 hover:underline">
                          {publisher.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {publisher.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm">{publisher.phone}</p>
                      </div>
                    </div>
                  )}

                  {(publisher.address_line1 ||
                    publisher.city ||
                    publisher.state ||
                    publisher.postal_code ||
                    publisher.country ||
                    publisher.country_details) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <div className="text-sm space-y-1">
                          {publisher.address_line1 && <p>{publisher.address_line1}</p>}
                          {publisher.address_line2 && <p>{publisher.address_line2}</p>}
                          {(publisher.city || publisher.state || publisher.postal_code) && (
                            <p>
                              {publisher.city && `${publisher.city}, `}
                              {publisher.state && `${publisher.state} `}
                              {publisher.postal_code && publisher.postal_code}
                            </p>
                          )}
                          <p>{publisher.country_details?.name || publisher.country || "Unknown"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-center md:justify-start">
                <Link href={`/publishers/${publisher.id}/edit`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    <span>Edit Publisher</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:w-2/3 lg:w-3/4">
              <Tabs defaultValue="about">
                <TabsList className="mb-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="books">Books</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h2 className="text-xl font-semibold mb-2">About {publisher.name}</h2>
                      {publisher.about ? (
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: publisher.about }} />
                      ) : (
                        <p className="text-muted-foreground">No information available about this publisher.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="books" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Books by {publisher.name}</h2>
                    <Link href={`/books?publisher=${publisher.id}`}>
                      <Button variant="link" className="flex items-center gap-1">
                        <span>View all</span>
                      </Button>
                    </Link>
                  </div>

                  {books.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {books.map((book) => (
                        <Link href={`/books/${book.id}`} key={book.id} className="block">
                          <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                            <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
                              <Image
                                src={book.cover_image_url || "/placeholder.svg?height=300&width=200&query=book+cover"}
                                alt={book.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <CardContent className="p-3">
                              <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-1">{book.author_name}</p>
                              {book.binding && <p className="text-xs text-muted-foreground">{book.binding}</p>}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Building className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium">No books found</h3>
                        <p className="text-muted-foreground">
                          We don't have any books from this publisher in our database yet.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
