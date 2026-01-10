import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Globe, MapPin, Edit2, Settings, User, Twitter, Facebook, Instagram, BookOpen } from 'lucide-react'
import { BookCard } from '@/components/book-card'
import { useState, useRef, useEffect } from 'react'
import { EditSectionModal } from '@/components/entity/EditSectionModal'
import Link from 'next/link'
import { ExpandableSection } from '@/components/ui/expandable-section'
import { ContactInfo } from '@/types/contact'
import { getContactInfo } from '@/utils/contactInfo'

interface AuthorData {
  id?: string | number
  name?: string
  bio?: string | null
  birth_date?: string | null
  nationality?: string | null
  website?: string | null
  twitter_handle?: string | null
  facebook_handle?: string | null
  instagram_handle?: string | null
  goodreads_url?: string | null
}

interface BookData {
  id: number | string
  title: string
  cover_image_url?: string
}

// Overview Section
export function OverviewSection({
  author,
  onRefresh,
  canEdit = false,
}: {
  author: AuthorData
  onRefresh?: () => void
  canEdit?: boolean
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    if (onRefresh) onRefresh()
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  return (
    <Card className="overview-section mb-6" id="overview" key={`overview-${refreshKey}`}>
      <div className="overview-section__header flex flex-col space-y-1.5 p-4 border-b">
        <div className="overview-section__title-row flex justify-between items-center">
          <h3 className="overview-section__title text-xl font-semibold">Overview</h3>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="overview-section__edit-button h-8 gap-1"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 className="overview-section__edit-icon h-4 w-4" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>
      <CardContent className="overview-section__content p-4 space-y-4">
        {author.bio && author.bio.trim() ? (
          <div className="overview-section__bio space-y-2">
            <ExpandableSection title={null}>{author.bio}</ExpandableSection>
          </div>
        ) : (
          <p className="overview-section__empty-message text-muted-foreground italic">
            No biography information available.
          </p>
        )}
        
        {author.birth_date && (
          <div className="overview-section__birth-date flex items-center">
            <Calendar className="overview-section__birth-date-icon h-4 w-4 mr-2 text-muted-foreground" />
            <span className="overview-section__birth-date-text">
              Born {formatDate(author.birth_date)}
            </span>
          </div>
        )}

        {author.nationality && (
          <div className="overview-section__nationality flex items-center">
            <User className="overview-section__nationality-icon h-4 w-4 mr-2 text-muted-foreground" />
            <span className="overview-section__nationality-text">
              {author.nationality}
            </span>
          </div>
        )}

        {author.website && (
          <div className="overview-section__website flex items-start">
            <Globe className="overview-section__website-icon h-4 w-4 mr-2 text-muted-foreground flex-shrink-0 mt-1" />
            <a
              href={
                author.website.startsWith('http')
                  ? author.website
                  : `https://${author.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="overview-section__website-link text-primary hover:underline break-words"
            >
              Website
            </a>
          </div>
        )}

        {(author.twitter_handle || author.facebook_handle || author.instagram_handle || author.goodreads_url) && (
          <div className="overview-section__social-links space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Follow</div>
            <div className="flex flex-wrap gap-2">
              {author.twitter_handle && (
                <a
                  href={`https://twitter.com/${author.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              )}
              {author.facebook_handle && (
                <a
                  href={`https://facebook.com/${author.facebook_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
              )}
              {author.instagram_handle && (
                <a
                  href={`https://instagram.com/${author.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              )}
              {author.goodreads_url && (
                <a
                  href={author.goodreads_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium"
                >
                  <BookOpen className="h-4 w-4" />
                  Goodreads
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {canEdit && (
        <EditSectionModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          section="overview"
          entityType="author"
          entityId={author.id || ''}
          initialData={{
            bio: author.bio || '',
            birth_date: author.birth_date || '',
            nationality: author.nationality || '',
            website: author.website || '',
            twitter_handle: author.twitter_handle || '',
            facebook_handle: author.facebook_handle || '',
            instagram_handle: author.instagram_handle || '',
            goodreads_url: author.goodreads_url || '',
          }}
          onSuccess={handleRefresh}
        />
      )}
    </Card>
  )
}

// Contact Information Section
export function ContactSection({
  author,
  onRefresh,
  canEdit = false,
}: {
  author: AuthorData
  onRefresh?: () => void
  canEdit?: boolean
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    // Refetch contact info
    const fetchContactInfo = async () => {
      const info = await getContactInfo('author', author.id?.toString() || '')
      if (info) {
        setContactInfo(info)
      }
    }
    fetchContactInfo()
    if (onRefresh) onRefresh()
  }

  useEffect(() => {
    const fetchContactInfo = async () => {
      const info = await getContactInfo('author', author.id?.toString() || '')
      if (info) {
        setContactInfo(info)
      }
    }
    fetchContactInfo()
  }, [author.id, refreshKey])

  return (
    <Card className="contact-section mb-6" id="contact-info" key={`contact-${refreshKey}`}>
      <div className="contact-section__header flex flex-col space-y-1.5 p-4 border-b">
        <div className="contact-section__title-row flex justify-between items-center">
          <h3 className="contact-section__title text-xl font-semibold">Contact Information</h3>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="contact-section__edit-button h-8 gap-1"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 className="contact-section__edit-icon h-4 w-4" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>
      <CardContent className="contact-section__content p-4">
        <div className="contact-section__grid grid grid-cols-1 md:grid-cols-2 gap-4">
          {contactInfo?.email && (
            <div className="contact-section__email flex flex-col">
              <span className="contact-section__label text-sm text-muted-foreground">Email</span>
              <a
                href={`mailto:${contactInfo.email}`}
                className="contact-section__email-link text-primary hover:underline"
              >
                {contactInfo.email}
              </a>
            </div>
          )}
          {contactInfo?.phone && (
            <div className="contact-section__phone flex flex-col">
              <span className="contact-section__label text-sm text-muted-foreground">Phone</span>
              <a
                href={`tel:${contactInfo.phone}`}
                className="contact-section__phone-link text-primary hover:underline"
              >
                {contactInfo.phone}
              </a>
            </div>
          )}
          {contactInfo?.website && (
            <div className="contact-section__website flex flex-col">
              <span className="contact-section__label text-sm text-muted-foreground">Website</span>
              <a
                href={
                  contactInfo.website.startsWith('http')
                    ? contactInfo.website
                    : `https://${contactInfo.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="contact-section__website-link text-primary hover:underline"
              >
                {contactInfo.website}
              </a>
            </div>
          )}
          {(contactInfo?.address_line1 ||
            contactInfo?.address_line2 ||
            contactInfo?.city ||
            contactInfo?.state ||
            contactInfo?.postal_code ||
            contactInfo?.country) && (
            <div className="contact-section__address flex flex-col">
              <span className="contact-section__label text-sm text-muted-foreground">Address</span>
              <div className="flex flex-col">
                {contactInfo.address_line1 && <span>{contactInfo.address_line1}</span>}
                {contactInfo.address_line2 && <span>{contactInfo.address_line2}</span>}
                <span>
                  {[contactInfo.city, contactInfo.state, contactInfo.postal_code]
                    .filter(Boolean)
                    .join(', ')}
                </span>
                {contactInfo.country && <span>{contactInfo.country}</span>}
              </div>
            </div>
          )}
          {!contactInfo?.email &&
            !contactInfo?.phone &&
            !contactInfo?.website &&
            !contactInfo?.address_line1 &&
            !contactInfo?.address_line2 &&
            !contactInfo?.city &&
            !contactInfo?.state &&
            !contactInfo?.postal_code &&
            !contactInfo?.country && (
              <div className="col-span-2 text-center text-muted-foreground py-4">
                No contact information available
              </div>
            )}
        </div>
      </CardContent>

      {canEdit && (
        <EditSectionModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          section="contact"
          entityType="author"
          entityId={author.id || ''}
          initialData={{
            email: contactInfo?.email || '',
            phone: contactInfo?.phone || '',
          }}
          onSuccess={handleRefresh}
        />
      )}
    </Card>
  )
}

// Location Section
export function LocationSection({
  author,
  onRefresh,
  canEdit = false,
}: {
  author: AuthorData
  onRefresh?: () => void
  canEdit?: boolean
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [editedContact, setEditedContact] = useState<ContactInfoInput>({
    entity_type: 'author',
    entity_id: author.id?.toString() || '',
  })

  useEffect(() => {
    const fetchContactInfo = async () => {
      const info = await getContactInfo('author', author.id?.toString() || '')
      if (info) {
        setContactInfo(info)
        setEditedContact({
          entity_type: 'author',
          entity_id: author.id?.toString() || '',
          address_line1: info.address_line1,
          address_line2: info.address_line2,
          city: info.city,
          state: info.state,
          postal_code: info.postal_code,
          country: info.country,
        })
      }
    }
    fetchContactInfo()
  }, [author.id, refreshKey])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    if (onRefresh) onRefresh()
  }

  const formatLocation = () => {
    const parts = []

    if (contactInfo?.city) {
      parts.push(contactInfo.city)
    }

    if (contactInfo?.state) {
      parts.push(contactInfo.state)
    }

    if (contactInfo?.country) {
      parts.push(contactInfo.country)
    }

    return parts
  }

  const handleUpdateLocation = async () => {
    try {
      const updatedContact = await upsertContactInfo({
        entity_type: 'author',
        entity_id: author.id?.toString() || '',
        address_line1: editedContact.address_line1 || undefined,
        address_line2: editedContact.address_line2 || undefined,
        city: editedContact.city || undefined,
        state: editedContact.state || undefined,
        postal_code: editedContact.postal_code || undefined,
        country: editedContact.country || undefined,
      })

      if (updatedContact) {
        setContactInfo(updatedContact)
        setIsEditModalOpen(false)
        handleRefresh()
      }
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  return (
    <Card className="location-section mb-6" id="location" key={`location-${refreshKey}`}>
      <div className="location-section__header flex flex-col space-y-1.5 p-4 border-b">
        <div className="location-section__title-row flex justify-between items-center">
          <h3 className="location-section__title text-xl font-semibold">Location</h3>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="location-section__edit-button h-8 gap-1"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 className="location-section__edit-icon h-4 w-4" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>
      <CardContent className="location-section__content p-4">
        {contactInfo?.address_line1 ||
        contactInfo?.address_line2 ||
        contactInfo?.city ||
        contactInfo?.state ||
        contactInfo?.postal_code ||
        contactInfo?.country ? (
          <div className="location-section__info space-y-2">
            {contactInfo.address_line1 && (
              <div className="location-section__address flex items-start">
                <MapPin className="location-section__map-icon h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                <div className="location-section__address-details flex flex-col">
                  <span className="location-section__address-line">{contactInfo.address_line1}</span>
                  {contactInfo.address_line2 && (
                    <span className="location-section__address-line">
                      {contactInfo.address_line2}
                    </span>
                  )}
                  <span className="location-section__address-line">
                    {[contactInfo.city, contactInfo.state, contactInfo.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                  {contactInfo.country && (
                    <span className="location-section__country">{contactInfo.country}</span>
                  )}
                </div>
              </div>
            )}
            {!contactInfo.address_line1 && (
              <div className="location-section__simple-location flex items-center">
                <MapPin className="location-section__map-icon h-4 w-4 mr-2 text-muted-foreground" />
                <span className="location-section__location-text">
                  {formatLocation().join(', ')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="location-section__empty-message text-muted-foreground italic">
            No location information available.
          </p>
        )}
      </CardContent>

      {canEdit && (
        <EditSectionModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          section="location"
          entityType="author"
          entityId={author.id || ''}
          initialData={{
            address_line1: contactInfo?.address_line1 || '',
            address_line2: contactInfo?.address_line2 || '',
            city: contactInfo?.city || '',
            state: contactInfo?.state || '',
            postal_code: contactInfo?.postal_code || '',
            country: contactInfo?.country || '',
          }}
          onSuccess={handleRefresh}
        />
      )}
    </Card>
  )
}

// Books Section
export function BooksSection({
  books,
  booksCount,
  onViewAllBooks,
}: {
  books?: BookData[]
  booksCount?: number
  onViewAllBooks: () => void
}) {
  return (
    <Card className="books-section mb-6" id="books">
      <div className="books-section__header flex flex-col space-y-1.5 p-4 border-b">
        <h3 className="books-section__title text-xl font-semibold">Published Books</h3>
      </div>
      <CardContent className="books-section__content p-4">
        {books && books.length > 0 ? (
          <div className="books-section__with-content">
            <p className="books-section__count mb-4">
              This author has written {booksCount || books.length} {(booksCount || books.length) === 1 ? 'book' : 'books'}.
            </p>
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
            {(booksCount || books.length) > 8 && (
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
          <p className="books-section__empty-message text-muted-foreground italic">
            No books have been written yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// About Tab Navigation
export function AboutNavigation({ authorId }: { authorId?: string | number }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="about-navigation bg-white rounded-lg shadow-sm overflow-hidden sticky top-20">
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
              <div
                className="about-navigation__dropdown-menu py-1"
                role="menu"
                aria-orientation="vertical"
              >
                <Link
                  href={`/authors/${authorId}/edit?section=about`}
                  className="about-navigation__dropdown-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <Edit2 className="about-navigation__dropdown-icon h-4 w-4 mr-2" />
                  Edit About
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
