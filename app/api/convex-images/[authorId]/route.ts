import { NextResponse } from 'next/server'
import { convexServer } from '@/lib/convex-server'
import { api } from '@/convex/_generated/api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ authorId: string }> }
) {
  const { authorId } = await params
  
  if (!authorId) {
    return NextResponse.json(
      { error: 'authorId is required' },
      { status: 400 }
    )
  }
  
  try {
    const images = await convexServer.query(api.queries.entityImages.getAuthorImages, { authorId })
    
    // Find avatar image - check both image_type and alt_text (case-insensitive)
    const avatarImage = images?.find((img: any) => {
      const type = img.image_type?.toLowerCase() || ''
      const alt = img.alt_text?.toLowerCase() || ''
      return type === 'author_avatar' || 
             img.is_featured ||
             alt.includes('avatar')
    })
    
    // Find cover image - check both image_type and alt_text (case-insensitive)
    const coverImage = images?.find((img: any) => {
      const type = img.image_type?.toLowerCase() || ''
      const alt = img.alt_text?.toLowerCase() || ''
      return type === 'author_cover' ||
             alt.includes('cover for author')
    })
    
    return NextResponse.json({
      success: true,
      avatar_url: avatarImage?.url || '',
      cover_url: coverImage?.url || '',
      all_images: images?.map((img: any) => ({
        url: img.url,
        image_type: img.image_type,
        alt_text: img.alt_text,
      })) || [],
    })
  } catch (error) {
    console.error('Error fetching Convex images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images', success: false },
      { status: 500 }
    )
  }
}
