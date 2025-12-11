import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      )
    }

    revalidatePath(`/books/${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Revalidate error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to revalidate book page" },
      { status: 500 }
    )
  }
}

