import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, Globe, MapPin, Edit2 } from "lucide-react"
import { BookCard } from "@/components/book-card"
import Link from "next/link"

interface PublisherData {
  id?: string | number
  name?: string
  about?: string
  founded_year?: number
  website?: string
  email?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  country_details?: {
    id?: number
    name?: string
    code?: string
  }
}

interface BookData {
  id: number | string
  title: string
  cover_image_url?: string
}

// Overview Section
export function OverviewSection({ publisher }: { publisher: PublisherData }) {
  return (
    <Card className="mb-6" id="overview">
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Overview</h3>
          <Link href={`/publishers/${publisher.id}/edit?section=overview`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
        </div>
      </div>
      <CardContent className="p-6 space-y-4">
        {publisher.about ? (
          <p className="text-base">{publisher.about}</p>
        ) : (
          <p className="text-muted-foreground italic">No overview information available.</p>
        )}
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>Founded in {publisher.founded_year || "N/A"}</span>
        </div>
        {publisher.website && (
          <div className="flex items-center">
            <a
              href={publisher.website.startsWith('http') ? publisher.website : `https://${publisher.website}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="h-4 w-4" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Contact Information Section
export function ContactSection({ publisher }: { publisher: PublisherData }) {
  return (
    <Card className="mb-6" id="contact-info">
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Contact Information</h3>
          <Link href={`/publishers/${publisher.id}/edit?section=contact`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publisher.email && (
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Email</span>
              <a href={`mailto:${publisher.email}`} className="text-primary hover:underline">
                {publisher.email}
              </a>
            </div>
          )}
          {publisher.phone && (
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Phone</span>
              <a href={`tel:${publisher.phone}`} className="text-primary hover:underline">
                {publisher.phone}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Location Section
export function LocationSection({ publisher }: { publisher: PublisherData }) {
  // Format location with state and country code when available
  const formatLocation = () => {
    const parts = [];
    
    // Add city if available
    if (publisher.city) {
      parts.push(publisher.city);
    }
    
    // Format state and country code in "MD, USA" format when both available
    if (publisher.state && publisher.country_details?.code) {
      parts.push(`${publisher.state}, ${publisher.country_details.code}`);
    } else {
      // Otherwise, add state if available
      if (publisher.state) {
        parts.push(publisher.state);
      }
      
      // Add country if available (prefer code if available)
      if (publisher.country_details?.code) {
        parts.push(publisher.country_details.code);
      } else if (publisher.country) {
        parts.push(publisher.country);
      } else if (publisher.country_details?.name) {
        parts.push(publisher.country_details.name);
      }
    }
    
    return parts;
  };

  return (
    <Card className="mb-6" id="location">
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Location</h3>
          <Link href={`/publishers/${publisher.id}/edit?section=location`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
        </div>
      </div>
      <CardContent className="p-6">
        {(publisher.address_line1 || publisher.city || publisher.state || publisher.country) ? (
          <div className="space-y-2">
            {publisher.address_line1 && (
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{publisher.address_line1}</span>
                  {publisher.address_line2 && <span>{publisher.address_line2}</span>}
                  <span>
                    {[
                      publisher.city,
                      publisher.state,
                      publisher.postal_code
                    ].filter(Boolean).join(', ')}
                  </span>
                  {(publisher.country || publisher.country_details) && (
                    <span>
                      {publisher.country_details?.code || publisher.country || publisher.country_details?.name}
                    </span>
                  )}
                </div>
              </div>
            )}
            {!publisher.address_line1 && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {formatLocation().join(', ')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No location information available.</p>
        )}
      </CardContent>
    </Card>
  )
}

// Published Books Section
export function BooksSection({ 
  books, 
  booksCount, 
  onViewAllBooks 
}: { 
  books?: BookData[], 
  booksCount?: number,
  onViewAllBooks: () => void
}) {
  return (
    <Card className="mb-6" id="books">
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <h3 className="text-xl font-semibold">Published Books</h3>
      </div>
      <CardContent className="p-6">
        {books && books.length > 0 ? (
          <div>
            <p className="mb-4">This publisher has published {booksCount} books.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {books.slice(0, 8).map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id.toString()}
                  title={book.title}
                  coverImageUrl={book.cover_image_url}
                />
              ))}
            </div>
            {(booksCount || 0) > 8 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={onViewAllBooks}
                  className="mt-2"
                >
                  View All Books
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No books have been published yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

// About Tab Navigation
export function AboutNavigation() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">About</h2>
      </div>
      <nav className="p-2">
        <a
          href="#overview"
          className="flex items-center px-3 py-2 rounded-md hover:bg-muted text-primary"
        >
          Overview
        </a>
        <a 
          href="#contact-info" 
          className="flex items-center px-3 py-2 rounded-md hover:bg-muted"
        >
          Contact Information
        </a>
        <a 
          href="#location" 
          className="flex items-center px-3 py-2 rounded-md hover:bg-muted"
        >
          Location
        </a>
        <a 
          href="#books" 
          className="flex items-center px-3 py-2 rounded-md hover:bg-muted"
        >
          Published Books
        </a>
      </nav>
    </div>
  )
} 