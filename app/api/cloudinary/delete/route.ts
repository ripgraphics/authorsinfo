import { type NextRequest, NextResponse } from "next/server"
import cloudinary from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { publicId } = body

    // Validate the public ID
    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json({ error: "Invalid public ID" }, { status: 400 })
    }

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result !== "ok") {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
