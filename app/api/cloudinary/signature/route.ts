import { type NextRequest, NextResponse } from "next/server"
import cloudinary from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { folder } = body

    // Validate the folder path to prevent directory traversal attacks
    if (!folder || typeof folder !== "string" || !folder.match(/^[a-zA-Z0-9_/-]+$/)) {
      return NextResponse.json({ error: "Invalid folder path" }, { status: 400 })
    }

    // Create the full folder path
    const fullFolderPath = `authorsinfo/${folder}`

    // Generate a timestamp for the signature
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Generate the signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: fullFolderPath,
      },
      process.env.CLOUDINARY_API_SECRET as string,
    )

    // Return the necessary data for the frontend to use
    return NextResponse.json({
      timestamp,
      signature,
      folder: fullFolderPath,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    })
  } catch (error) {
    console.error("Error generating Cloudinary signature:", error)
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 })
  }
}
