import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || ''
    const maxResults = searchParams.get('max_results') || '50'

    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary credentials are not properly configured' },
        { status: 500 }
      )
    }

    // Create a timestamp for the signature
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Prepare parameters for the API call
    const params: Record<string, string> = {
      timestamp: timestamp.toString(),
      max_results: maxResults,
    }

    // Add folder if specified
    if (folder) {
      params.prefix = folder
    }

    // Sort parameters alphabetically by key as required by Cloudinary
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc: Record<string, string>, key) => {
        acc[key] = params[key]
        return acc
      }, {})

    // Create signature string from sorted parameters
    const signatureString =
      Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join('&') + apiSecret

    // Generate the signature
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    // Build the URL with parameters
    const urlParams = new URLSearchParams({
      api_key: apiKey,
      timestamp: timestamp.toString(),
      signature: signature,
      max_results: maxResults,
    })

    if (folder) {
      urlParams.append('prefix', folder)
    }

    // Call Cloudinary API to list resources
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${urlParams}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudinary API error:', errorText)
      return NextResponse.json(
        { error: `Failed to fetch images: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: {
        resources: data.resources || [],
        next_cursor: data.next_cursor,
        total_count: data.resources?.length || 0,
      },
    })
  } catch (error) {
    console.error('Error listing Cloudinary images:', error)
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 })
  }
}

