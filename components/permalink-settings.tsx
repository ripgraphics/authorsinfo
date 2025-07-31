'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Loader2, Link, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  validatePermalinkFormat, 
  checkPermalinkAvailability, 
  updateEntityPermalink,
  generatePermalink,
  generatePermalinkAPI,
  type EntityType 
} from '@/lib/permalink-utils'

interface PermalinkSettingsProps {
  entityId: string
  entityType: EntityType
  currentPermalink?: string
  entityName: string
  className?: string
}

export function PermalinkSettings({
  entityId,
  entityType,
  currentPermalink,
  entityName,
  className = ''
}: PermalinkSettingsProps) {
  const [permalink, setPermalink] = useState(currentPermalink || '')
  const [isChecking, setIsChecking] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [validation, setValidation] = useState<{
    isValid: boolean
    error?: string
    suggestions?: string[]
  }>({ isValid: true })
  const [availability, setAvailability] = useState<{
    isAvailable: boolean
    error?: string
    suggestions?: string[]
  }>({ isAvailable: true })
  const { toast } = useToast()

  // Generate initial permalink if none exists
  useEffect(() => {
    if (!currentPermalink && entityName) {
      const generated = generatePermalink(entityName)
      setPermalink(generated)
    }
  }, [currentPermalink, entityName])

  // Check availability when permalink changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!permalink) return

      setIsChecking(true)
      const result = await checkPermalinkAvailability(permalink, entityType, entityId)
      setAvailability(result)
      setIsChecking(false)
    }

    const timeoutId = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timeoutId)
  }, [permalink, entityType, entityId])

  // Validate format when permalink changes
  useEffect(() => {
    if (!permalink) {
      setValidation({ isValid: true })
      return
    }

    const result = validatePermalinkFormat(permalink)
    setValidation(result)
  }, [permalink])

  const handlePermalinkChange = (value: string) => {
    setPermalink(value.toLowerCase())
  }

  const handleGeneratePermalink = async () => {
    if (!entityName) return

    setIsChecking(true)
    try {
      const result = await generatePermalinkAPI(entityName, entityType, entityId)
      if (result.success && result.permalink) {
        setPermalink(result.permalink)
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Failed to generate permalink",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error generating permalink:', error)
      toast({
        title: "Generation failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleUpdatePermalink = async () => {
    if (!permalink || !validation.isValid || !availability.isAvailable) {
      return
    }

    setIsUpdating(true)
    
    try {
      const result = await updateEntityPermalink(entityId, entityType, permalink)
      
      if (result.success) {
        toast({
          title: "Permalink updated",
          description: `Your permalink has been updated to "${permalink}"`,
        })
        
        // Update the URL to reflect the new permalink
        const newUrl = `/${entityType}s/${permalink}`
        window.history.replaceState({}, '', newUrl)
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Failed to update permalink",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating permalink:', error)
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCopyPermalink = () => {
    const url = `${window.location.origin}/${entityType}s/${permalink}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Copied!",
      description: "Permalink URL copied to clipboard",
    })
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    if (!validation.isValid) {
      return <AlertCircle className="h-4 w-4 text-destructive" />
    }
    
    if (!availability.isAvailable) {
      return <AlertCircle className="h-4 w-4 text-destructive" />
    }
    
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }

  const getStatusText = () => {
    if (isChecking) {
      return "Checking availability..."
    }
    
    if (!validation.isValid) {
      return validation.error || "Invalid format"
    }
    
    if (!availability.isAvailable) {
      return availability.error || "Already taken"
    }
    
    return "Available"
  }

  const getStatusColor = () => {
    if (isChecking) {
      return "text-muted-foreground"
    }
    
    if (!validation.isValid || !availability.isAvailable) {
      return "text-destructive"
    }
    
    return "text-green-600"
  }

  const isUpdateDisabled = !permalink || !validation.isValid || !availability.isAvailable || isChecking || isUpdating

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Custom Permalink
        </CardTitle>
        <CardDescription>
          Set a custom URL for your {entityType} profile. This will be used in your profile URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="permalink">Permalink</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="permalink"
                value={permalink}
                onChange={(e) => handlePermalinkChange(e.target.value)}
                placeholder={`Enter your ${entityType} permalink`}
                className="font-mono"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleGeneratePermalink}
              disabled={!entityName || isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </div>

        {/* Status and validation */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Suggestions */}
        {availability.suggestions && availability.suggestions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Suggestions:</Label>
            <div className="flex flex-wrap gap-2">
              {availability.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPermalink(suggestion)}
                  className="font-mono text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Current permalink display */}
        {currentPermalink && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Current permalink:</Label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <span className="font-mono text-sm">
                {window.location.origin}/{entityType}s/{currentPermalink}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPermalink}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Update button */}
        <Button
          onClick={handleUpdatePermalink}
          disabled={isUpdateDisabled}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Updating...
            </>
          ) : (
            <>
              <Link className="h-4 w-4 mr-2" />
              Update Permalink
            </>
          )}
        </Button>

        {/* Help text */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Permalinks can only contain lowercase letters, numbers, and hyphens. 
            They must be between 3 and 100 characters long.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
} 