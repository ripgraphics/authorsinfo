import { Button } from "@/components/ui/button"

import { supabaseAdmin } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getStatistics() {
  // Get binding type statistics
  const { data: bindingStats } = await supabaseAdmin
    .from("books")
    .select("binding_type_id, count(*)")
    .not("binding_type_id", "is", null)
    .group("binding_type_id")

  // Get format type statistics
  const { data: formatStats } = await supabaseAdmin
    .from("books")
    .select("format_type_id, count(*)")
    .not("format_type_id", "is", null)
    .group("format_type_id")

  // Get binding types
  const { data: bindingTypes } = await supabaseAdmin.from("binding_types").select("id, name")

  // Get format types
  const { data: formatTypes } = await supabaseAdmin.from("format_types").select("id, name")

  // Process binding stats with names
  const bindingTypesWithNames =
    bindingStats?.map((stat) => {
      const bindingType = bindingTypes?.find((type) => type.id === stat.binding_type_id)
      return {
        name: bindingType?.name || "Unknown",
        count: stat.count,
      }
    }) || []

  // Process format stats with names
  const formatTypesWithNames =
    formatStats?.map((stat) => {
      const formatType = formatTypes?.find((type) => type.id === stat.format_type_id)
      return {
        name: formatType?.name || "Unknown",
        count: stat.count,
      }
    }) || []

  return {
    bindingTypesWithNames,
    formatTypesWithNames,
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
            </TabsContent>

            <TabsContent value="format" className="space-y-4">
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
