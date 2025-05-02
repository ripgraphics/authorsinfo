import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProfileEditPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Edit Publisher Data</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Publisher Select</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Select a publisher to edit from the options below:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild className="w-full">
                  <Link href="/publishers/117/edit">
                    Edit Simon & Schuster (ID: 117)
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/publishers/291/edit">
                    Edit Penguin Random House (ID: 291)
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/publishers/135/edit">
                    Edit HarperCollins (ID: 135)
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/publishers/274/edit">
                    Edit Macmillan (ID: 274)
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/publishers">
                    View All Publishers
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 