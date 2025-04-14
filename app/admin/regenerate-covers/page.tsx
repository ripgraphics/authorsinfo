"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  regenerateBookCovers,
  getTotalBooksWithOriginalImages,
  getTotalBooksWithEmptyCovers,
} from "@/app/actions/regenerate-book-covers"
import { AlertCircle, CheckCircle2, XCircle, Pause, Play, RotateCw } from "lucide-react"

export default function RegenerateCoversPage() {
  const [batchSize, setBatchSize] = useState(10)
  const [maxWidth, setMaxWidth] = useState(600)
  const [maxHeight, setMaxHeight] = useState(900)
  const [filterEmptyCovers, setFilterEmptyCovers] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState({
    processed: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0,
    lastProcessedId: null as string | null,
    errors: [] as Array<{ id: string; error: string }>,
    success: [] as Array<{ id: string; oldUrl: string | null; newUrl: string }>,
  })
  const [stats, setStats] = useState({
    totalWithOriginalImages: 0,
    totalWithEmptyCovers: 0,
  })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch initial stats
  useEffect(() => {
    async function fetchStats() {
      const totalWithOriginalImages = await getTotalBooksWithOriginalImages()
      const totalWithEmptyCovers = await getTotalBooksWithEmptyCovers()
      setStats({ totalWithOriginalImages, totalWithEmptyCovers })
    }
    fetchStats()
  }, [])

  // Handle auto-continue timer
  useEffect(() => {
    if (isProcessing && !isPaused && progress.processed < progress.total) {
      timerRef.current = setTimeout(() => {
        processBatch()
      }, 20000) // 20 seconds
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isProcessing, isPaused, progress])

  const startProcessing = async () => {
    setIsProcessing(true)
    setIsPaused(false)
    setProgress({
      processed: 0,
      total: 0,
      currentBatch: 0,
      totalBatches: 0,
      lastProcessedId: null,
      errors: [],
      success: [],
    })
    await processBatch()
  }

  const processBatch = async () => {
    try {
      const result = await regenerateBookCovers(
        batchSize,
        maxWidth,
        maxHeight,
        progress.lastProcessedId,
        filterEmptyCovers,
      )

      setProgress((prev) => ({
        ...result,
        errors: [...prev.errors, ...result.errors],
        success: [...prev.success, ...result.success],
      }))

      // Check if we're done
      if (result.processed === 0 || result.processed + progress.processed >= result.total) {
        setIsProcessing(false)
        setIsPaused(false)
      }
    } catch (error) {
      console.error("Error processing batch:", error)
      setIsPaused(true)
    }
  }

  const togglePause = () => {
    setIsPaused((prev) => !prev)
    if (isPaused && isProcessing) {
      processBatch()
    }
  }

  const resetProcess = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setIsProcessing(false)
    setIsPaused(false)
    setProgress({
      processed: 0,
      total: 0,
      currentBatch: 0,
      totalBatches: 0,
      lastProcessedId: null,
      errors: [],
      success: [],
    })
  }

  const percentComplete = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Regenerate Book Covers</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Book Statistics</CardTitle>
            <CardDescription>Current book cover status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Books with original images:</span>
                <span className="font-medium">{stats.totalWithOriginalImages}</span>
              </div>
              <div className="flex justify-between">
                <span>Books with empty covers:</span>
                <span className="font-medium">{stats.totalWithEmptyCovers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Regeneration Settings</CardTitle>
            <CardDescription>Configure how book covers should be regenerated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  min={1}
                  max={100}
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxWidth">Max Width (px)</Label>
                <Input
                  id="maxWidth"
                  type="number"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(Number(e.target.value))}
                  min={100}
                  max={2000}
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHeight">Max Height (px)</Label>
                <Input
                  id="maxHeight"
                  type="number"
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(Number(e.target.value))}
                  min={100}
                  max={2000}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="filterEmptyCovers"
                  checked={filterEmptyCovers}
                  onCheckedChange={setFilterEmptyCovers}
                  disabled={isProcessing}
                />
                <Label htmlFor="filterEmptyCovers">Only process books with empty covers</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetProcess} disabled={!isProcessing && progress.processed === 0}>
              <RotateCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <div className="space-x-2">
              {isProcessing && (
                <Button onClick={togglePause} variant="secondary">
                  {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
              )}
              <Button
                onClick={isProcessing ? processBatch : startProcessing}
                disabled={(isProcessing && !isPaused) || (progress.processed >= progress.total && progress.total > 0)}
              >
                {isProcessing ? "Process Next Batch" : "Start Processing"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {isProcessing || progress.processed > 0 ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Progress</CardTitle>
              <CardDescription>
                Batch {progress.currentBatch} of {progress.totalBatches || "?"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={percentComplete} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>
                    {progress.processed} of {progress.total} books processed
                  </span>
                  <span>{percentComplete}% complete</span>
                </div>

                {isPaused && (
                  <Alert variant="warning" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Processing Paused</AlertTitle>
                    <AlertDescription>Processing has been paused. Click Resume to continue.</AlertDescription>
                  </Alert>
                )}

                {progress.processed >= progress.total && progress.total > 0 && (
                  <Alert variant="success" className="mt-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Processing Complete</AlertTitle>
                    <AlertDescription>All book covers have been processed successfully.</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="success">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="success">Success ({progress.success.length})</TabsTrigger>
              <TabsTrigger value="errors">Errors ({progress.errors.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="success">
              <Card>
                <CardHeader>
                  <CardTitle>Successfully Processed Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {progress.success.map((item, index) => (
                        <div key={index} className="p-4 border rounded-md">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-16 h-24 bg-gray-100 rounded overflow-hidden">
                              <img
                                src={item.newUrl || "/placeholder.svg"}
                                alt="New cover"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Book ID: {item.id}</span>
                              </div>
                              <div className="mt-2 text-sm">
                                <a
                                  href={item.newUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  View new cover
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {progress.success.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No books have been successfully processed yet.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="errors">
              <Card>
                <CardHeader>
                  <CardTitle>Error Processing Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {progress.errors.map((item, index) => (
                        <div key={index} className="p-4 border rounded-md bg-red-50">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="font-medium">Book ID: {item.id}</span>
                          </div>
                          <div className="mt-2 text-sm text-red-600">Error: {item.error}</div>
                        </div>
                      ))}
                      {progress.errors.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No errors have occurred during processing.</div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </div>
  )
}
