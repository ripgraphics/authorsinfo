import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params
    const supabase = createClient()

    // Get the current user for authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let entityData: any = null

    switch (type) {
      case 'user':
        // Fetch user data with friends, followers, and books read
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            full_name,
            avatar_url,
            created_at,
            bio,
            location,
            website
          `)
          .eq('id', id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get friends count
        const { count: friendsCount } = await supabase
          .from('user_friends')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id)
          .eq('status', 'accepted')

        // Get followers count
        const { count: followersCount } = await supabase
          .from('user_friends')
          .select('*', { count: 'exact', head: true })
          .eq('friend_id', id)
          .eq('status', 'accepted')

        // Get books read count
        const { count: booksReadCount } = await supabase
          .from('reading_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id)
          .eq('status', 'completed')

        entityData = {
          ...userData,
          friend_count: friendsCount || 0,
          followers_count: followersCount || 0,
          books_read_count: booksReadCount || 0
        }
        break

      case 'author':
        // Fetch author data
        const { data: authorData, error: authorError } = await supabase
          .from('authors')
          .select(`
            id,
            name,
            author_image,
            bio,
            created_at
          `)
          .eq('id', id)
          .single()

        if (authorError) {
          console.error('Error fetching author data:', authorError)
          return NextResponse.json({ error: 'Author not found' }, { status: 404 })
        }

        // Get book count for author
        const { count: bookCount } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', id)

        entityData = {
          ...authorData,
          bookCount: bookCount || 0
        }
        break

      case 'publisher':
        // Fetch publisher data
        const { data: publisherData, error: publisherError } = await supabase
          .from('publishers')
          .select(`
            id,
            name,
            publisher_image,
            logo_url,
            location,
            created_at
          `)
          .eq('id', id)
          .single()

        if (publisherError) {
          console.error('Error fetching publisher data:', publisherError)
          return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
        }

        // Get book count for publisher
        const { count: pubBookCount } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('publisher_id', id)

        entityData = {
          ...publisherData,
          bookCount: pubBookCount || 0
        }
        break

      case 'group':
        // Fetch group data
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select(`
            id,
            name,
            group_image,
            description,
            created_at
          `)
          .eq('id', id)
          .single()

        if (groupError) {
          console.error('Error fetching group data:', groupError)
          return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        }

        // Get member count for group
        const { count: memberCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', id)
          .eq('status', 'active')

        entityData = {
          ...groupData,
          member_count: memberCount || 0
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    return NextResponse.json({ data: entityData })

  } catch (error) {
    console.error('Error fetching entity hover data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
