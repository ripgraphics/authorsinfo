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
import { Checkbox } from "@/components/ui/checkbox"
import {
  regenerateBookCovers,
  getTotalBooksWithOriginalImages,
  getProblematicCoverStats,
  getTotalBooksWithProblematicCoversAlt,
} from "@/app/actions/regenerate-book-covers"
import { AlertCircle, CheckCircle2, XCircle, Pause, Play, RotateCw, Clock } from "lucide-react"

export default function RegenerateCoversPage() {
  const [batchSize, setBatchSize] = useState(10)
  const [maxWidth, setMaxWidth] = useState(600)
  const [maxHeight, setMaxHeight] = useState(900)
  const [filterEmptyCovers, setFilterEmptyCovers] = useState(true)
  const [problemTypes, setProblemTypes] = useState<string[]>(["empty", "broken", "null_id", "null"])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [nextBatchCountdown, setNextBatchCountdown] = useState(0)
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
    totalWithProblematicCovers: 0,
    emptyBraces: 0,
    nullUrl: 0,
    brokenUrl: 0,
    nullId: 0,
  })
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch initial stats
  useEffect(() => {
    fetchStats()
  }, [])

  // Function to fetch stats that can be called after each batch
  const fetchStats = async () => {
    try {
      const totalWithOriginalImages = await getTotalBooksWithOriginalImages()
      const totalWithProblematicCovers = await getTotalBooksWithProblematicCoversAlt()
      const problemStats = await getProblematicCoverStats()

      setStats({
        totalWithOriginalImages,
        totalWithProblematicCovers,
        ...problemStats,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Set default values if there's an error
      setStats({
        totalWithOriginalImages: 0,
        totalWithProblematicCovers: 0,
        emptyBraces: 0,
        nullUrl: 0,
        brokenUrl: 0,
        nullId: 0,
      })
    }
  }

  // Handle auto-continue timer and countdown
  useEffect(() => {
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }

    // If processing is active and not paused, and there are more books to process
    if (isProcessing && !isPaused && progress.processed < progress.total) {
      // Set the countdown timer (20 seconds)
      setNextBatchCountdown(20)

      // Update countdown every second
      countdownRef.current = setInterval(() => {
        setNextBatchCountdown((prev) => {
          if (prev <= 1) {
            // Clear the interval when we reach 0
            if (countdownRef.current) {
              clearInterval(countdownRef.current)
              countdownRef.current = null
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Set the timer to process the next batch
      timerRef.current = setTimeout(() => {
        processBatch()
      }, 20000) // 20 seconds
    }

    return () => {
      // Clean up timers on unmount or when dependencies change
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [isProcessing, isPaused, progress])

  const startProcessing = async () => {
    setIsProcessing(true)
    setIsPaused(false)
    setIsComplete(false)
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
      // Update UI to show processing state
      setIsProcessing(true)
      setIsPaused(false)

      const result = await regenerateBookCovers(
        batchSize,
        maxWidth,
        maxHeight,
        progress.lastProcessedId,
        filterEmptyCovers,
        problemTypes,
      )

      // Update progress with new results
      setProgress((prev) => ({
        ...result,
        errors: [...prev.errors, ...result.errors],
        success: [...prev.success, ...result.success],
      }))

      // Refresh stats after each batch
      await fetchStats()

      // Check if we're done
      if (result.processed === 0 || result.processed + progress.processed >= result.total) {
        setIsProcessing(false)
        setIsPaused(false)
        setIsComplete(true)

        // Clear any existing timers
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }

        if (countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
        }
      }
    } catch (error) {
      console.error("Error processing batch:", error)
      setIsPaused(true)
    }
  }

  const togglePause = () => {
    setIsPaused((prev) => !prev)

    // If we're unpausing, process the next batch immediately
    if (isPaused && isProcessing) {
      // Clear existing timers
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }

      processBatch()
    }
  }

  const resetProcess = () => {
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }

    setIsProcessing(false)
    setIsPaused(false)
    setIsComplete(false)
    setNextBatchCountdown(0)
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

  const handleProblemTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setProblemTypes((prev) => [...prev, type])
    } else {
      setProblemTypes((prev) => prev.filter((t) => t !== type))
    }
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
                <span>Books with problematic covers:</span>
                <span className="font-medium">{stats.totalWithProblematicCovers}</span>
              </div>
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Problem Types:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>NULL cover_image_id:</span>
                    <span>{stats.nullId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Empty braces {"{}"}:</span>
                    <span>{stats.emptyBraces}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NULL URL in images:</span>
                    <span>{stats.nullUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Broken URLs (with fetch:):</span>
                    <span>{stats.brokenUrl}</span>
                  </div>
                </div>
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
                <Label htmlFor="filterEmptyCovers">Only process books with problematic covers</Label>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <Label className="mb-2 block">Problem types to fix:</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="null_id"
                    checked={problemTypes.includes("null_id")}
                    onCheckedChange={(checked) => handleProblemTypeChange("null_id", checked === true)}
                    disabled={isProcessing}
                  />
                  <Label htmlFor="null_id">NULL cover_image_id</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="empty"
                    checked={problemTypes.includes("empty")}
                    onCheckedChange={(checked) => handleProblemTypeChange("empty", checked === true)}
                    disabled={isProcessing}
                  />
                  <Label htmlFor="empty">Empty braces {"{}"}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="null"
                    checked={problemTypes.includes("null")}
                    onCheckedChange={(checked) => handleProblemTypeChange("null", checked === true)}
                    disabled={isProcessing}
                  />
                  <Label htmlFor="null">NULL URL in images</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="broken"
                    checked={problemTypes.includes("broken")}
                    onCheckedChange={(checked) => handleProblemTypeChange("broken", checked === true)}
                    disabled={isProcessing}
                  />
                  <Label htmlFor="broken">Broken URLs (with fetch:)</Label>
                </div>
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
                disabled={(isProcessing && !isPaused) || (isComplete && progress.processed >= progress.total)}
              >
                {isProcessing ? "Process Next Batch Now" : "Start Processing"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {(isProcessing || progress.processed > 0) && (
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

                {nextBatchCountdown > 0 && isProcessing && !isPaused && (
                  <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    Next batch in {nextBatchCountdown} seconds
                  </div>
                )}

                {isPaused && (
                  <Alert variant="warning" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Processing Paused</AlertTitle>
                    <AlertDescription>Processing has been paused. Click Resume to continue.</AlertDescription>
                  </Alert>
                )}

                {isComplete && progress.processed >= progress.total && progress.total > 0 && (
                  <Alert variant="success" className="mt-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Processing Complete</AlertTitle>
                    <AlertDescription>
                      All {progress.processed} book covers have been processed successfully.
                      {progress.success.length > 0 && ` ${progress.success.length} covers were successfully updated.`}
                      {progress.errors.length > 0 && ` ${progress.errors.length} errors occurred.`}
                    </AlertDescription>
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
      )}
    </div>
  )
}
