'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle, Loader2, Settings, Zap, Shield, BarChart3 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

interface GenerationResult {
  success: boolean
  message: string
  stats?: {
    processed: number
    inserted: number
    duplicates: number
    errors: string[]
  }
  breakdown?: {
    authors: { processed: number; inserted: number; duplicates: number }
    books: { processed: number; inserted: number; duplicates: number }
    publishers: { processed: number; inserted: number; duplicates: number }
    users: { processed: number; inserted: number; duplicates: number }
    groups: { processed: number; inserted: number; duplicates: number }
  }
}

export function EnterpriseActivityForm() {
  const [type, setType] = useState<string>('all')
  const [entityIds, setEntityIds] = useState<string>('')
  const [options, setOptions] = useState({
    skipDuplicates: true,
    includeMetadata: true,
    batchSize: 100,
    entityTypes: ['authors', 'books', 'publishers', 'users', 'groups'],
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setResult(null)
      setError(null)
      setProgress(0)

      // Parse entity IDs if provided
      const parsedEntityIds = entityIds.trim()
        ? entityIds.split(',').map((id) => id.trim())
        : undefined

      const response = await fetch('/api/admin/enterprise-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          entityIds: parsedEntityIds,
          options,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate activities')
      }

      setResult(data)
      setProgress(100)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setProgress(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEntityTypeChange = (entityType: string, checked: boolean) => {
    setOptions((prev) => ({
      ...prev,
      entityTypes: checked
        ? [...prev.entityTypes, entityType]
        : prev.entityTypes.filter((type) => type !== entityType),
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Enterprise Activity Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activity Type Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Activity Type</Label>
            <RadioGroup
              value={type}
              onValueChange={setType}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="flex items-start space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="all" id="all" />
                <div className="grid gap-1.5">
                  <Label htmlFor="all" className="font-medium">
                    All Entities
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Generate activities for all authors, books, publishers, users, and groups
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="authors" id="authors" />
                <div className="grid gap-1.5">
                  <Label htmlFor="authors" className="font-medium">
                    Authors Only
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Generate activities for all authors and their books
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="books" id="books" />
                <div className="grid gap-1.5">
                  <Label htmlFor="books" className="font-medium">
                    Books Only
                  </Label>
                  <p className="text-sm text-muted-foreground">Generate activities for all books</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Entity IDs Input */}
          <div>
            <Label htmlFor="entityIds" className="text-base font-medium mb-2 block">
              Specific Entity IDs (Optional)
            </Label>
            <Input
              id="entityIds"
              placeholder="Enter comma-separated UUIDs (e.g., uuid1,uuid2,uuid3)"
              value={entityIds}
              onChange={(e) => setEntityIds(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave empty to process all entities of the selected type
            </p>
          </div>

          {/* Enterprise Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <Label className="text-base font-medium">Enterprise Options</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipDuplicates"
                    checked={options.skipDuplicates}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, skipDuplicates: checked as boolean }))
                    }
                  />
                  <Label htmlFor="skipDuplicates" className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Skip Duplicates
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Prevent duplicate activities within the last 24 hours
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMetadata"
                    checked={options.includeMetadata}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, includeMetadata: checked as boolean }))
                    }
                  />
                  <Label htmlFor="includeMetadata" className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    Include Metadata
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Add batch tracking and system metadata
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="batchSize" className="text-sm font-medium">
                Batch Size
              </Label>
              <Select
                value={options.batchSize.toString()}
                onValueChange={(value) =>
                  setOptions((prev) => ({ ...prev, batchSize: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 records</SelectItem>
                  <SelectItem value="100">100 records</SelectItem>
                  <SelectItem value="200">200 records</SelectItem>
                  <SelectItem value="500">500 records</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Number of records processed in each batch for optimal performance
              </p>
            </div>

            {/* Entity Type Selection for "all" type */}
            {type === 'all' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Entity Types to Process</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['authors', 'books', 'publishers', 'users', 'groups'].map((entityType) => (
                    <div key={entityType} className="flex items-center space-x-2">
                      <Checkbox
                        id={entityType}
                        checked={options.entityTypes.includes(entityType)}
                        onCheckedChange={(checked) =>
                          handleEntityTypeChange(entityType, checked as boolean)
                        }
                      />
                      <Label htmlFor={entityType} className="text-sm capitalize">
                        {entityType}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating activities...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full md:w-auto"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Activities...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate Enterprise Activities
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Generation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert
                className={
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }
              >
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </AlertDescription>
              </Alert>

              {result.stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.stats.processed}</div>
                    <div className="text-sm text-blue-600">Processed</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.stats.inserted}</div>
                    <div className="text-sm text-green-600">Inserted</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {result.stats.duplicates}
                    </div>
                    <div className="text-sm text-yellow-600">Duplicates Skipped</div>
                  </div>
                </div>
              )}

              {result.breakdown && (
                <div className="space-y-3">
                  <h4 className="font-medium">Breakdown by Entity Type</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(result.breakdown).map(([entityType, stats]) => (
                      <div key={entityType} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium capitalize text-sm">{entityType}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Processed: {stats.processed} | Inserted: {stats.inserted} | Skipped:{' '}
                          {stats.duplicates}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.stats?.errors && result.stats.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors</h4>
                  <div className="space-y-1">
                    {result.stats.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded-sm">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
