"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EntityHeader, TabConfig } from "@/components/entity-header"
import { EntityPhotoAlbums } from "@/components/user-photo-albums"
import { FollowersListTab } from "@/components/followers-list-tab"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from "next/navigation"
import EnterpriseTimelineActivities from '@/components/enterprise/enterprise-timeline-activities-optimized'
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Camera,
  MessageSquare,
  UserPlus,
  MoreHorizontal,
  ImageIcon,
  Book,
  Star,
  Heart,
  Share2,
  Ellipsis,
  Filter,
  ChevronDown,
  Building,
  Info,
  Globe,
  Ticket
} from "lucide-react"
import { format } from 'date-fns'

interface ClientEventPageProps {
  event: any
  coverImageUrl: string
  params: {
    slug: string
  }
  followers?: any[]
  followersCount?: number
  speakers?: any[]
  sessions?: any[]
  books?: any[]
}

export function ClientEventPage({ 
  event: initialEvent, 
  coverImageUrl, 
  params, 
  followers = [], 
  followersCount = 0,
  speakers = [],
  sessions = [],
  books = []
}: ClientEventPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const tabs: TabConfig[] = [
    { id: "timeline", label: "Timeline" },
    { id: "about", label: "About" },
    { id: "speakers", label: "Speakers" },
    { id: "schedule", label: "Schedule" },
    { id: "followers", label: "Followers" },
    { id: "photos", label: "Photos" },
    { id: "more", label: "More" }
  ]
  
  const tabParam = searchParams.get("tab")
  const tabIds = tabs.map(t => t.id)
  const activeTab = tabIds.includes(tabParam || "") ? tabParam! : tabs[0].id
  
  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tabId)
    router.replace(`?${params.toString()}`)
  }
  
  const [event, setEvent] = useState(initialEvent)
  const [refreshing, setRefreshing] = useState(false)

  // Format dates
  const formattedStartDate = format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')
  const formattedStartTime = format(new Date(event.start_date), 'h:mm a')
  const formattedEndTime = format(new Date(event.end_date), 'h:mm a')
  
  // Format price display
  const priceDisplay = event.is_free 
    ? 'Free' 
    : event.price 
      ? `${event.currency || '$'}${event.price}` 
      : 'Paid Event'
  
  // Determine if registration is open
  const now = new Date()
  const registrationOpens = event.registration_opens_at ? new Date(event.registration_opens_at) : null
  const registrationCloses = event.registration_closes_at ? new Date(event.registration_closes_at) : null
  
  const registrationNotYetOpen = registrationOpens && now < registrationOpens
  const registrationClosed = registrationCloses && now > registrationCloses
  const registrationActive = event.requires_registration && 
    !registrationNotYetOpen && 
    !registrationClosed &&
    event.status === 'published'

  // Function to refresh event data
  const refreshEventData = async () => {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/events/${params.slug}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event data')
      }
      const updatedEvent = await response.json()
      setEvent(updatedEvent)
    } catch (error) {
      console.error('Error refreshing event data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleAlbumCreated = () => {
    refreshEventData()
  }

  return (
    <div className="event-page">
      {/* Header Section */}
      <div className="event-page__header">
        <div className="event-page__header-content">
          <div className="event-page__header-main">
            <div className="event-page__header-info">
              <h1 className="event-page__title">{event.title}</h1>
              <div className="event-page__meta">
                <div className="event-page__date-time">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedStartDate}</span>
                  <span>·</span>
                  <Clock className="h-4 w-4" />
                  <span>{formattedStartTime} - {formattedEndTime}</span>
                </div>
                {event.location && (
                  <div className="event-page__location">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location.name}</span>
                  </div>
                )}
                <div className="event-page__price">
                  <Ticket className="h-4 w-4" />
                  <span>{priceDisplay}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="event-page__header-nav border-t">
          <div className="event-page__header-nav-container">
            <EntityHeader
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              entity={event}
              entityType="event"
              coverImageUrl={coverImageUrl}
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      {activeTab === "timeline" && (
        <div className="event-page__content">
          <div className="event-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT SIDEBAR - 1 Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* About Section */}
              <Card>
                <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                  <div className="text-2xl font-semibold leading-none tracking-tight">About</div>
                  <button 
                    className="text-sm text-primary hover:underline"
                    onClick={() => handleTabChange("about")}
                  >
                    View More
                  </button>
                </div>
                <CardContent className="p-6 pt-0">
                  <p className="line-clamp-4">{event?.description || "No description available."}</p>
                </CardContent>
              </Card>

              {/* Registration Status */}
              {event.requires_registration && (
                <Card>
                  <div className="space-y-1.5 p-6">
                    <div className="text-2xl font-semibold leading-none tracking-tight">Registration</div>
                  </div>
                  <CardContent className="p-6 pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          registrationActive 
                            ? 'bg-green-100 text-green-800' 
                            : registrationClosed 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {registrationActive 
                            ? 'Open' 
                            : registrationClosed 
                            ? 'Closed' 
                            : 'Not Yet Open'}
                        </span>
                      </div>
                      {registrationActive && (
                        <Button className="w-full">
                          Register Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Photos Section */}
              <Card>
                <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                  <div className="text-2xl font-semibold leading-none tracking-tight">Photos</div>
                  <button 
                    className="text-sm text-primary hover:underline"
                    onClick={() => handleTabChange("photos")}
                  >
                    See All
                  </button>
                </div>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div key={num} className="aspect-square relative rounded overflow-hidden">
                      <img 
                        src={`/placeholder.svg?height=300&width=300`}
                        alt={`Event Photo ${num}`}
                        className="object-cover hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                      />
                    </div>
                  ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MAIN CONTENT - Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <EnterpriseTimelineActivities
                entityId={params.slug}
                entityType="event"
                isOwnEntity={user && user.role === "admin"}
                entityDisplayInfo={{
                  id: params.slug,
                  name: event.title,
                  type: 'event' as const,
                  event_image: coverImageUrl ? { url: coverImageUrl } : undefined,
                  start_date: event.start_date,
                  end_date: event.end_date,
                  location: event.location?.name
                }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "about" && (
        <div className="event-page__tab-content">
          <Card>
            <div className="space-y-1.5 p-6">
              <div className="text-2xl font-semibold leading-none tracking-tight">About This Event</div>
            </div>
            <CardContent className="p-6 pt-0">
              <div className="prose prose-blue max-w-none">
                {event.description ? (
                  <div dangerouslySetInnerHTML={{ __html: event.description }} />
                ) : event.summary ? (
                  <p>{event.summary}</p>
                ) : (
                  <p>No description available for this event.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "speakers" && (
        <div className="event-page__tab-content space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Speakers</h2>
          </div>
          {speakers && speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {speakers.map((speaker) => (
                <Card key={speaker.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {speaker.headshot_url ? (
                        <div className="flex-shrink-0">
                          <img
                            src={speaker.headshot_url}
                            alt={speaker.name}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-medium">{speaker.name}</h3>
                        {speaker.presentation_title && (
                          <p className="text-blue-600 font-medium mt-1">{speaker.presentation_title}</p>
                        )}
                        {speaker.bio && (
                          <p className="text-gray-600 text-sm mt-2 line-clamp-3">{speaker.bio}</p>
                        )}
                        {speaker.author && (
                          <Link 
                            href={`/authors/${speaker.author.id}`} 
                            className="text-sm mt-2 text-blue-600 hover:underline inline-flex items-center"
                          >
                            View author profile
                            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No speakers announced</h3>
              <p className="mt-1 text-sm text-muted-foreground">Check back later for speaker announcements.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="event-page__tab-content space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Event Schedule</h2>
          </div>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{session.title}</h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Clock className="h-4 w-4 mr-1.5" />
                          <span>
                            {format(new Date(session.start_time), 'h:mm a')} - {format(new Date(session.end_time), 'h:mm a')}
                          </span>
                        </div>
                        {session.location && (
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1.5" />
                            <span>{session.location.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {session.requires_separate_registration && (
                        <div className="mt-4 md:mt-0">
                          <Button>
                            Register for Session
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {session.description && (
                      <p className="text-gray-600 text-sm mt-2">{session.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No schedule available</h3>
              <p className="mt-1 text-sm text-muted-foreground">Check back later for the event schedule.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "followers" && (
        <div className="event-page__tab-content space-y-6">
          <FollowersListTab
            followers={followers}
            followersCount={followersCount}
            entityId={params.slug}
            entityType="event"
          />
        </div>
      )}

      {activeTab === "photos" && (
        <div className="event-page__tab-content space-y-6">
          <EntityPhotoAlbums
            entityId={params.slug}
            entityType="event"
            isOwnEntity={user && user.role === "admin"}
          />
        </div>
      )}

      {activeTab === "more" && (
        <div className="event-page__tab-content">
          <h2 className="text-2xl font-semibold mb-4">More</h2>
          {/* Add more content here */}
        </div>
      )}
    </div>
  )
} 