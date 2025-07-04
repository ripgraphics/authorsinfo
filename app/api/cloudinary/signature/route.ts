import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { folder } = body

    console.log('Signature request received for folder:', folder)

    // Validate the folder path to prevent directory traversal attacks
    if (!folder || typeof folder !== "string" || !folder.match(/^[a-zA-Z0-9_/-]+$/)) {
      console.log('Invalid folder path:', folder)
      return NextResponse.json({ error: "Invalid folder path" }, { status: 400 })
    }

    // Create the full folder path
    const fullFolderPath = `authorsinfo/${folder}`
    console.log('Full folder path:', fullFolderPath)

    // Get Cloudinary credentials from environment variables (using same names as working upload)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    console.log('Environment variables check:')
    console.log('CLOUDINARY_CLOUD_NAME:', cloudName ? 'SET' : 'NOT SET')
    console.log('CLOUDINARY_API_KEY:', apiKey ? 'SET' : 'NOT SET')
    console.log('CLOUDINARY_API_SECRET:', apiSecret ? 'SET' : 'NOT SET')

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary credentials')
      return NextResponse.json({ error: "Cloudinary credentials not configured" }, { status: 500 })
    }

    // Generate a timestamp for the signature
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Create the parameters object for signature
    const params: Record<string, string> = {
      timestamp: timestamp.toString(),
      folder: fullFolderPath,
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
        .join("&") + apiSecret

    // Generate the signature
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex")

    console.log('Generated signature successfully')

    // Return the necessary data for the frontend to use
    return NextResponse.json({
      timestamp,
      signature,
      folder: fullFolderPath,
      apiKey,
      cloudName,
    })
  } catch (error) {
    console.error("Error generating Cloudinary signature:", error)
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 })
  }
} 