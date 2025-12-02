import { supabaseAdmin } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ClientProfilePage } from "./client"
import { getFollowersCount, getFollowers } from "@/lib/follows-server"
import { getFriends } from "@/lib/friends-server"

export const dynamic = "force-dynamic"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params

  try {
    // First, try to find user by permalink
    let user = null
    let error = null

    // Check if the ID looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

    if (isUUID) {
      // Try to find by UUID first
      const { data: uuidUser, error: uuidError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, permalink, location, website')
        .eq('id', id)
        .single()

      if (!uuidError && uuidUser) {
        user = uuidUser
      } else {
        // If not found by UUID, try by permalink
        const { data: permalinkUser, error: permalinkError } = await supabaseAdmin
          .from('users')
          .select('id, name, email, created_at, permalink, location, website')
          .eq('permalink', id)
          .single()

        if (!permalinkError && permalinkUser) {
          user = permalinkUser
        } else {
          error = permalinkError
        }
      }
    } else {
      // Try to find by permalink
      const { data: permalinkUser, error: permalinkError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, permalink, location, website')
        .eq('permalink', id)
        .single()

      if (!permalinkError && permalinkUser) {
        user = permalinkUser
      } else {
        error = permalinkError
      }
    }

    if (error || !user) {
      console.error("User not found:", error)
      notFound()
    }

    // Fetch user statistics
    let userStats = {
      booksRead: 0,
      friendsCount: 0,
      followersCount: 0, // Added missing followersCount
      location: user.location, // Now available from the users table
      website: user.website, // Now available from the users table
      joinedDate: user.created_at
    }

    // Initialize followers and friends arrays at the top level
    let followers: any[] = []
    let friends: any[] = []
    let books: any[] = []

    try {
      // Get books read count
      const { data: booksRead, error: booksError } = await supabaseAdmin
        .from('reading_progress')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed')

      if (!booksError) {
        userStats.booksRead = booksRead?.length || 0
        console.log('📚 Books Read Query:', { booksRead: booksRead?.length, error: booksError })
      }

      // Get friends count
      const { data: friendsCountData, error: friendsError } = await supabaseAdmin
        .from('user_friends')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      const { data: reverseFriends, error: reverseFriendsError } = await supabaseAdmin
        .from('user_friends')
        .select('id', { count: 'exact' })
        .eq('friend_id', user.id)
        .eq('status', 'accepted')

      if (!friendsError && !reverseFriendsError) {
        userStats.friendsCount = (friendsCountData?.length || 0) + (reverseFriends?.length || 0)
        
        console.log('👥 Friends Query:', { 
          friends: friendsCountData?.length, 
          reverseFriends: reverseFriends?.length,
          totalFriends: userStats.friendsCount
        })
      }

      // Get followers count and list from follows table (users following this user)
      try {
        const followersCount = await getFollowersCount(user.id, 'user')
        userStats.followersCount = followersCount
        
        // Fetch followers list if count > 0
        if (followersCount > 0) {
          const followersData = await getFollowers(user.id, 'user', 1, 100) // Get up to 100 followers
          followers = followersData.followers || []
        }
        console.log('👥 Followers Count:', followersCount, 'Followers List:', followers.length)
      } catch (followersError) {
        console.error("Error fetching followers:", followersError)
        // Continue with default value of 0
        userStats.followersCount = 0
        followers = []
      }

      // Get friends list (users who are friends with this user)
      try {
        if (userStats.friendsCount > 0) {
          const friendsData = await getFriends(user.id, 1, 100) // Get up to 100 friends
          friends = friendsData.friends || []
        }
        console.log('👥 Friends Count:', userStats.friendsCount, 'Friends List:', friends.length)
      } catch (friendsError) {
        console.error("Error fetching friends:", friendsError)
        friends = []
      }
    } catch (statsError) {
      console.error("Error fetching user stats:", statsError)
      // Continue with default values if stats fail
    }

    // Fetch avatar and cover images from images table via profiles
    let avatarUrl = "/placeholder.svg?height=200&width=200"
    let coverImageUrl = "/placeholder.svg?height=400&width=1200"

    try {
      // Get profile with avatar_image_id and cover_image_id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('avatar_image_id, cover_image_id')
        .eq('user_id', user.id)
        .single()

      if (!profileError && profile) {
        // Fetch avatar image if avatar_image_id exists
        if (profile.avatar_image_id) {
          const { data: avatarImage, error: avatarError } = await supabaseAdmin
            .from('images')
            .select('url')
            .eq('id', profile.avatar_image_id)
            .single()

          if (!avatarError && avatarImage?.url) {
            avatarUrl = avatarImage.url
          }
        }

        // Fetch cover image if cover_image_id exists
        if (profile.cover_image_id) {
          const { data: coverImage, error: coverError } = await supabaseAdmin
            .from('images')
            .select('url')
            .eq('id', profile.cover_image_id)
            .single()

          if (!coverError && coverImage?.url) {
            coverImageUrl = coverImage.url
          }
        }
      }
    } catch (imageError) {
      console.error("Error fetching profile images:", imageError)
      // Continue with placeholder images if fetch fails
    }

    // Fetch user's books from reading_progress
    try {
      // First, fetch reading progress entries - only select columns that exist for all statuses
      const { data: readingProgress, error: readingError } = await supabaseAdmin
        .from('reading_progress')
        .select('id, book_id, status, progress_percentage, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100)

      if (readingError) {
        console.error("Error fetching reading progress:", readingError)
        books = []
      } else if (readingProgress && readingProgress.length > 0) {
        // Get all book IDs
        const bookIds = readingProgress
          .map((rp: any) => rp.book_id)
          .filter(Boolean)

        if (bookIds.length === 0) {
          console.log('📚 No book IDs found in reading progress')
          books = []
        } else {
          // Fetch books with cover images
          const { data: booksFromDb, error: booksError } = await supabaseAdmin
            .from('books')
            .select(`
              id,
              title,
              cover_image_id,
              cover_image:images!books_cover_image_id_fkey(url, alt_text)
            `)
            .in('id', bookIds)

          if (booksError) {
            console.error("Error fetching books:", booksError)
            books = []
          } else if (!booksFromDb || booksFromDb.length === 0) {
            console.log('📚 No books found for IDs:', bookIds)
            books = []
          } else {
            const booksData = booksFromDb

            // Create a map of book_id to book data
            const booksMap = new Map<string, any>()
            booksData.forEach((book: any) => {
              booksMap.set(book.id, book)
            })

            // Fetch authors for all books
            let authorMap = new Map<string, any>()
            const { data: bookAuthors, error: authorsError } = await supabaseAdmin
              .from('book_authors')
              .select(`
                book_id,
                authors (
                  id,
                  name
                )
              `)
              .in('book_id', bookIds)

            if (!authorsError && bookAuthors) {
              bookAuthors.forEach((ba: any) => {
                if (ba.authors && !authorMap.has(ba.book_id)) {
                  authorMap.set(ba.book_id, ba.authors)
                }
              })
            }

            // For completed books, fetch rating separately if needed
            const completedBookIds = readingProgress
              .filter((rp: any) => rp.status === 'completed')
              .map((rp: any) => rp.book_id)
              .filter(Boolean)

            let ratingMap = new Map<string, number | null>()
            if (completedBookIds.length > 0) {
              const { data: completedProgress, error: ratingError } = await supabaseAdmin
                .from('reading_progress')
                .select('book_id, rating')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .in('book_id', completedBookIds)

              if (!ratingError && completedProgress) {
                completedProgress.forEach((cp: any) => {
                  if (cp.book_id && cp.rating !== null && cp.rating !== undefined) {
                    ratingMap.set(cp.book_id, cp.rating)
                  }
                })
              }
            }

            // Transform the data to match BookCard props
            books = readingProgress
              .map((rp: any) => {
                const book = booksMap.get(rp.book_id)
                if (!book || !book.id) {
                  return null
                }

                const author = authorMap.get(book.id) || null
                const rating = ratingMap.get(book.id) || null

                return {
                  id: book.id,
                  title: book.title,
                  coverImageUrl: book.cover_image?.url || null,
                  status: rp.status,
                  rating: rating,
                  progress_percentage: rp.progress_percentage,
                  author: author ? {
                    id: author.id,
                    name: author.name
                  } : null
                }
              })
              .filter(Boolean) // Remove null entries

            console.log('📚 Final books array:', {
              readingProgressCount: readingProgress.length,
              booksCount: books.length,
              bookIds: bookIds.length,
              booksDataCount: booksData.length,
              authorMapSize: authorMap.size
            })
          }
        }
      } else {
        console.log('📚 No reading progress found for user:', user.id)
        books = []
      }
    } catch (booksError) {
      console.error("Error fetching user books:", booksError)
      books = []
    }

    // Temporary debug logging
    console.log('🔍 Profile Page Debug:', {
      user: user,
      userStats: userStats,
      booksRead: userStats.booksRead,
      friendsCount: userStats.friendsCount,
      followersCount: userStats.followersCount,
      booksCount: books.length
    })

    return (
      <ClientProfilePage
        user={user}
        userStats={userStats}
        avatarUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        followers={followers}
        followersCount={userStats.followersCount}
        friends={friends}
        friendsCount={userStats.friendsCount}
        books={books}
        params={{ id: user.id }}
      />
    )
  } catch (error) {
    console.error("Error loading user profile:", error)
    notFound()
  }
}