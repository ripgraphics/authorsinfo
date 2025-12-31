'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export function GenerateActivitiesForm() {
  const [type, setType] = useState<string>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    stats?: any
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setResult(null)
      setError(null)

      const response = await fetch('/api/admin/generate-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate activities')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Generate Activities</h3>

      <div className="mb-6">
        <RadioGroup value={type} onValueChange={setType} className="flex flex-col space-y-3">
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="all" id="all" />
            <div className="grid gap-1.5">
              <Label htmlFor="all" className="font-medium">
                All entities
              </Label>
              <p className="text-sm text-muted-foreground">
                Generate activities for all authors, books, publishers, user profiles, and groups
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <RadioGroupItem value="author" id="author" />
            <div className="grid gap-1.5">
              <Label htmlFor="author" className="font-medium">
                Authors only
              </Label>
              <p className="text-sm text-muted-foreground">Generate activities for all authors</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <RadioGroupItem value="book" id="book" />
            <div className="grid gap-1.5">
              <Label htmlFor="book" className="font-medium">
                Books only
              </Label>
              <p className="text-sm text-muted-foreground">Generate activities for all books</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <RadioGroupItem value="publisher" id="publisher" />
            <div className="grid gap-1.5">
              <Label htmlFor="publisher" className="font-medium">
                Publishers only
              </Label>
              <p className="text-sm text-muted-foreground">
                Generate activities for all publishers
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <RadioGroupItem value="user" id="user" />
            <div className="grid gap-1.5">
              <Label htmlFor="user" className="font-medium">
                User profiles only
              </Label>
              <p className="text-sm text-muted-foreground">
                Generate activities for all user profiles
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <RadioGroupItem value="group" id="group" />
            <div className="grid gap-1.5">
              <Label htmlFor="group" className="font-medium">
                Groups only
              </Label>
              <p className="text-sm text-muted-foreground">Generate activities for all groups</p>
            </div>
          </div>
        </RadioGroup>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full sm:w-auto">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Activities'
        )}
      </Button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="ml-3">
              <h3
                className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-amber-800'}`}
              >
                {result.success ? 'Success' : 'Partial Success'}
              </h3>
              <div className="mt-1 text-sm">
                <p className={result.success ? 'text-green-700' : 'text-amber-700'}>
                  {result.message}
                </p>
                {result.stats && (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                    {result.stats.authors !== undefined && (
                      <li>Authors processed: {result.stats.authors}</li>
                    )}
                    {result.stats.books !== undefined && (
                      <li>Books processed: {result.stats.books}</li>
                    )}
                    {result.stats.publishers !== undefined && (
                      <li>Publishers processed: {result.stats.publishers}</li>
                    )}
                    {result.stats.userProfiles !== undefined && (
                      <li>User profiles processed: {result.stats.userProfiles}</li>
                    )}
                    {result.stats.users !== undefined && (
                      <li>User profiles processed: {result.stats.users}</li>
                    )}
                    {result.stats.groups !== undefined && (
                      <li>Groups processed: {result.stats.groups}</li>
                    )}
                    {result.stats.processed !== undefined && (
                      <li>Items processed: {result.stats.processed}</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
