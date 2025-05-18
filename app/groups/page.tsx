import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageContainer } from "@/components/page-container"

export const dynamic = "force-dynamic"

export default async function GroupsPage() {
  const { data: groups, error } = await supabaseAdmin
    .from("groups")
    .select(`
      id,
      name,
      cover_image:cover_image_id(id, url, alt_text),
      group_image:group_image_id(id, url, alt_text)
    `)

  if (error) {
    notFound()
  }

  if (!groups || groups.length === 0) {
    return (
      <PageContainer title="Groups">
        <div className="flex justify-end mb-4">
          <Link href="/groups/add">
            <Button>Add New Group</Button>
          </Link>
        </div>
        <p className="text-center text-muted-foreground py-12">No groups found. Create one to get started!</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Groups">
      <div className="flex justify-end mb-4">
        <Link href="/groups/add">
          <Button>Add New Group</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {groups.map((group) => {
          const coverUrl = group.cover_image?.[0]?.url || "/placeholder.svg?height=400&width=1200"
          return (
            <Link href={`/groups/${group.id}`} key={group.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative w-full aspect-[7/4]">
                  <img src={coverUrl} alt={group.name} className="object-cover w-full h-full" />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">{group.name}</h3>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </PageContainer>
  )
}
