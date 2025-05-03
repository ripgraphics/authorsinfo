import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, Globe, MapPin, Edit2, Settings } from "lucide-react"
import { BookCard } from "@/components/book-card"
import { useState, useRef, useEffect } from "react"
import { EditSectionModal } from "./EditSectionModal"
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
export function OverviewSection({ publisher, onRefresh }: { publisher: PublisherData, onRefresh?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    if (onRefresh) onRefresh();
  };
  
  // Function to count approx lines based on character count and average line length
  const countApproxLines = (text: string) => {
    const avgCharsPerLine = 80; // Approximate average characters per line
    return Math.ceil(text.length / avgCharsPerLine);
  };
  
  const hasLongContent = publisher.about && countApproxLines(publisher.about) > 20;
  
  return (
    <Card className="overview-section mb-6" id="overview" key={`overview-${refreshKey}`}>
      <div className="overview-section__header flex flex-col space-y-1.5 p-6 border-b">
        <div className="overview-section__title-row flex justify-between items-center">
          <h3 className="overview-section__title text-xl font-semibold">Overview</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="overview-section__edit-button h-8 gap-1"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="overview-section__edit-icon h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
      </div>
      <CardContent className="overview-section__content p-6 space-y-4">
        {publisher.about ? (
          <div className="overview-section__about space-y-2">
            <div className="overview-section__about-wrapper relative">
              <div 
                className={`overview-section__about-text whitespace-pre-wrap text-base ${!expanded && hasLongContent ? "line-clamp-20 overflow-hidden" : ""}`}
                style={{ maxHeight: !expanded && hasLongContent ? '500px' : 'none', overflow: !expanded && hasLongContent ? 'hidden' : 'visible' }}
              >
                {publisher.about}
              </div>
              {!expanded && hasLongContent && (
                <div className="overview-section__fade-gradient absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
              )}
            </div>
            {hasLongContent && (
              <Button 
                variant="outline" 
                size="sm"
                className="overview-section__toggle-button text-xs mt-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "View Less" : "View More"}
              </Button>
            )}
          </div>
        ) : (
          <p className="overview-section__empty-message text-muted-foreground italic">No overview information available.</p>
        )}
        <div className="overview-section__founded flex items-center">
          <Building className="overview-section__founded-icon h-4 w-4 mr-2 text-muted-foreground" />
          <span className="overview-section__founded-text">Founded in {publisher.founded_year || "N/A"}</span>
        </div>
        {publisher.website && (
          <div className="overview-section__website flex items-start">
            <Globe className="overview-section__website-icon h-4 w-4 mr-2 text-muted-foreground flex-shrink-0 mt-1" />
            <a
              href={publisher.website.startsWith('http') ? publisher.website : `https://${publisher.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="overview-section__website-link text-primary hover:underline break-words"
            >
              {publisher.website}
            </a>
          </div>
        )}
      </CardContent>
      
      <EditSectionModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        section="overview"
        publisherId={publisher.id || ""}
        initialData={{
          about: publisher.about,
          founded_year: publisher.founded_year,
          website: publisher.website
        }}
        onSuccess={handleRefresh}
      />
    </Card>
  )
}

// Contact Information Section
export function ContactSection({ publisher, onRefresh }: { publisher: PublisherData, onRefresh?: () => void }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    if (onRefresh) onRefresh();
  };
  
  return (
    <Card className="contact-section mb-6" id="contact-info" key={`contact-${refreshKey}`}>
      <div className="contact-section__header flex flex-col space-y-1.5 p-6 border-b">
        <div className="contact-section__title-row flex justify-between items-center">
          <h3 className="contact-section__title text-xl font-semibold">Contact Information</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="contact-section__edit-button h-8 gap-1"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="contact-section__edit-icon h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
      </div>
      <CardContent className="contact-section__content p-6">
        <div className="contact-section__grid grid grid-cols-1 md:grid-cols-2 gap-4">
          {publisher.email && (
            <div className="contact-section__email flex flex-col">
              <span className="contact-section__label text-sm text-muted-foreground">Email</span>
              <a href={`mailto:${publisher.email}`} className="contact-section__email-link text-primary hover:underline">
                {publisher.email}
              </a>
            </div>
          )}
          {publisher.phone && (
            <div className="contact-section__phone flex flex-col">
              <span className="contact-section__label text-sm text-muted-foreground">Phone</span>
              <a href={`tel:${publisher.phone}`} className="contact-section__phone-link text-primary hover:underline">
                {publisher.phone}
              </a>
            </div>
          )}
        </div>
      </CardContent>
      
      <EditSectionModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        section="contact"
        publisherId={publisher.id || ""}
        initialData={{
          email: publisher.email,
          phone: publisher.phone
        }}
        onSuccess={handleRefresh}
      />
    </Card>
  )
}

// Location Section
export function LocationSection({ publisher, onRefresh }: { publisher: PublisherData, onRefresh?: () => void }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    if (onRefresh) onRefresh();
  };
  
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
    <Card className="location-section mb-6" id="location" key={`location-${refreshKey}`}>
      <div className="location-section__header flex flex-col space-y-1.5 p-6 border-b">
        <div className="location-section__title-row flex justify-between items-center">
          <h3 className="location-section__title text-xl font-semibold">Location</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="location-section__edit-button h-8 gap-1"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="location-section__edit-icon h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
      </div>
      <CardContent className="location-section__content p-6">
        {(publisher.address_line1 || publisher.city || publisher.state || publisher.country) ? (
          <div className="location-section__info space-y-2">
            {publisher.address_line1 && (
              <div className="location-section__address flex items-start">
                <MapPin className="location-section__map-icon h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                <div className="location-section__address-details flex flex-col">
                  <span className="location-section__address-line">{publisher.address_line1}</span>
                  {publisher.address_line2 && <span className="location-section__address-line">{publisher.address_line2}</span>}
                  <span className="location-section__address-line">
                    {[
                      publisher.city,
                      publisher.state,
                      publisher.postal_code
                    ].filter(Boolean).join(', ')}
                  </span>
                  {(publisher.country || publisher.country_details) && (
                    <span className="location-section__country">
                      {publisher.country_details?.code || publisher.country || publisher.country_details?.name}
                    </span>
                  )}
                </div>
              </div>
            )}
            {!publisher.address_line1 && (
              <div className="location-section__simple-location flex items-center">
                <MapPin className="location-section__map-icon h-4 w-4 mr-2 text-muted-foreground" />
                <span className="location-section__location-text">
                  {formatLocation().join(', ')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="location-section__empty-message text-muted-foreground italic">No location information available.</p>
        )}
      </CardContent>
      
      <EditSectionModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        section="location"
        publisherId={publisher.id || ""}
        initialData={{
          address_line1: publisher.address_line1,
          address_line2: publisher.address_line2,
          city: publisher.city,
          state: publisher.state,
          postal_code: publisher.postal_code,
          country: publisher.country
        }}
        onSuccess={handleRefresh}
      />
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
    <Card className="books-section mb-6" id="books">
      <div className="books-section__header flex flex-col space-y-1.5 p-6 border-b">
        <h3 className="books-section__title text-xl font-semibold">Published Books</h3>
      </div>
      <CardContent className="books-section__content p-6">
        {books && books.length > 0 ? (
          <div className="books-section__with-content">
            <p className="books-section__count mb-4">This publisher has published {booksCount} books.</p>
            <div className="books-section__grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
              <div className="books-section__view-all mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={onViewAllBooks}
                  className="books-section__view-all-button mt-2"
                >
                  View All Books
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="books-section__empty-message text-muted-foreground italic">No books have been published yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

// About Tab Navigation
export function AboutNavigation({ publisherId }: { publisherId?: string | number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="about-navigation bg-white rounded-lg shadow overflow-hidden sticky top-20">
      <div className="about-navigation__header p-4 border-b flex justify-between items-center">
        <h2 className="about-navigation__title text-lg font-medium">About</h2>
        <div className="about-navigation__settings-wrapper relative" ref={menuRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="about-navigation__settings-button h-8 w-8 rounded-full"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Settings className="about-navigation__settings-icon h-4 w-4" />
          </Button>
          {menuOpen && (
            <div className="about-navigation__dropdown absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="about-navigation__dropdown-menu py-1" role="menu" aria-orientation="vertical">
                <Link 
                  href={`/publishers/${publisherId}/edit?section=about`}
                  className="about-navigation__dropdown-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <Edit2 className="about-navigation__dropdown-icon h-4 w-4 mr-2" />
                  Edit About
                </Link>
                <Link 
                  href={`/publishers/${publisherId}/settings`}
                  className="about-navigation__dropdown-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="about-navigation__dropdown-icon h-4 w-4 mr-2" />
                  Settings
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <nav className="about-navigation__nav p-2">
        <a
          href="#overview"
          className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted text-primary"
        >
          Overview
        </a>
        <a 
          href="#contact-info" 
          className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted"
        >
          Contact Information
        </a>
        <a 
          href="#location" 
          className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted"
        >
          Location
        </a>
        <a 
          href="#books" 
          className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted"
        >
          Published Books
        </a>
      </nav>
    </div>
  )
} 