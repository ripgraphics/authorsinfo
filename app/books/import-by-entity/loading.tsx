import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="book-page container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        <p className="text-lg text-gray-500">Loading import page...</p>
      </div>
    </div>
  )
}
