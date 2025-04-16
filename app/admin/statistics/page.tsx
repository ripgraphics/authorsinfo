import { Button } from "@/components/ui/button"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getStatistics() {
  try {
    // Get all books with their binding types
    const { data: booksWithBindingTypes, error: bindingError } = await supabaseAdmin
      .from("books")
      .select("binding_type_id")
      .not("binding_type_id", "is", null)

    if (bindingError) {
      console.error("Error fetching binding stats:", bindingError)
      return { bindingTypesWithNames: [], formatTypesWithNames: [] }
    }

    // Get all books with their format types
    const { data: booksWithFormatTypes, error: formatError } = await supabaseAdmin
      .from("books")
      .select("format_type_id")
      .not("format_type_id", "is", null)

    if (formatError) {
      console.error("Error fetching format stats:", formatError)
      return { bindingTypesWithNames: [], formatTypesWithNames: [] }
    }

    // Get binding types
    const { data: bindingTypes, error: bindingTypesError } = await supabaseAdmin
      .from("binding_types")
      .select("id, name")

    if (bindingTypesError) {
      console.error("Error fetching binding types:", bindingTypesError)
      return { bindingTypesWithNames: [], formatTypesWithNames: [] }
    }

    // Get format types
    const { data: formatTypes, error: formatTypesError } = await supabaseAdmin.from("format_types").select("id, name")

    if (formatTypesError) {
      console.error("Error fetching format types:", formatTypesError)
      return { bindingTypesWithNames: [], formatTypesWithNames: [] }
    }

    // Count binding types manually
    const bindingTypeCounts = {}
    booksWithBindingTypes?.forEach((book) => {
      if (book.binding_type_id) {
        bindingTypeCounts[book.binding_type_id] = (bindingTypeCounts[book.binding_type_id] || 0) + 1
      }
    })

    // Count format types manually
    const formatTypeCounts = {}
    booksWithFormatTypes?.forEach((book) => {
      if (book.format_type_id) {
        formatTypeCounts[book.format_type_id] = (formatTypeCounts[book.format_type_id] || 0) + 1
      }
    })

    // Process binding stats with names
    const bindingTypesWithNames =
      bindingTypes
        ?.map((type) => {
          return {
            name: type.name,
            count: bindingTypeCounts[type.id] || 0,
          }
        })
        .filter((item) => item.count > 0) || []

    // Process format stats with names
    const formatTypesWithNames =
      formatTypes
        ?.map((type) => {
          return {
            name: type.name,
            count: formatTypeCounts[type.id] || 0,
          }
        })
        .filter((item) => item.count > 0) || []

    return {
      bindingTypesWithNames,
      formatTypesWithNames,
    }
  } catch (error) {
    console.error("Error in getStatistics:", error)
    return { bindingTypesWithNames: [], formatTypesWithNames: [] }
  }
}

export default async function StatisticsPage() {
  const { bindingTypesWithNames, formatTypesWithNames } = await getStatistics()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Statistics</h1>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center">
            <Button variant="ghost">Author&apos;s Info</Button>
            <span className="text-gray-400 mx-2">/</span>
            <Button variant="ghost">Admin</Button>
            <span className="text-gray-400 mx-2">/</span>
            <Button variant="ghost">Statistics</Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="binding">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Book Format Statistics</h3>
              <TabsList>
                <TabsTrigger value="binding">Binding Types</TabsTrigger>
                <TabsTrigger value="format">Format Types</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="binding" className="space-y-4">
              {bindingTypesWithNames.length > 0 ? (
                <>
                  <div className="h-64">
                    <div className="w-full h-full flex items-end justify-between">
                      {bindingTypesWithNames.map((item, i) => (
                        <div key={item.name} className="flex flex-col items-center">
                          <div className="w-16 flex flex-col items-center">
                            <div
                              className="w-full bg-blue-400 rounded-t-sm"
                              style={{ height: `${Math.min(200, item.count * 10)}px` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-2 text-gray-500">{item.name}</div>
                          <div className="text-xs font-medium">{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 mt-8">
                    {bindingTypesWithNames.map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm">{item.count}</div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{
                              width: `${(item.count / Math.max(...bindingTypesWithNames.map((i) => i.count))) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">No binding type data available</div>
              )}
            </TabsContent>

            <TabsContent value="format" className="space-y-4">
              {formatTypesWithNames.length > 0 ? (
                <>
                  <div className="h-64">
                    <div className="w-full h-full flex items-end justify-between">
                      {formatTypesWithNames.map((item, i) => (
                        <div key={item.name} className="flex flex-col items-center">
                          <div className="w-16 flex flex-col items-center">
                            <div
                              className="w-full bg-green-400 rounded-t-sm"
                              style={{ height: `${Math.min(200, item.count * 10)}px` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-2 text-gray-500">{item.name}</div>
                          <div className="text-xs font-medium">{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 mt-8">
                    {formatTypesWithNames.map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm">{item.count}</div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{
                              width: `${(item.count / Math.max(...formatTypesWithNames.map((i) => i.count))) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">No format type data available</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
