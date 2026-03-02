'use client'

import React, { useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Image as ImageIcon, Loader2, Smile } from 'lucide-react'
import { uploadImage } from '@/app/actions/upload'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Grid } from '@giphy/react-components'
import { GiphyFetch } from '@giphy/js-fetch-api'
import type { IGif } from '@giphy/js-types'
import type { EmojiClickData } from 'emoji-picker-react'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

const appendWithSpacing = (currentValue: string, token: string) => {
  if (!currentValue.trim()) return token
  const needsSpace = !currentValue.endsWith(' ')
  return `${currentValue}${needsSpace ? ' ' : ''}${token}`
}

interface CommentComposerToolbarProps {
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
  className?: string
  buttonClassName?: string
  showGif?: boolean
  uploadFolder?: string
  maxImageSizeMb?: number
}

export function CommentComposerToolbar({
  value,
  onChange,
  disabled = false,
  className,
  buttonClassName,
  showGif = true,
  uploadFolder = 'comments',
  maxImageSizeMb = 8,
}: CommentComposerToolbarProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isGifDialogOpen, setIsGifDialogOpen] = useState(false)
  const [gifQuery, setGifQuery] = useState('trending')

  const maxImageSizeBytes = useMemo(() => maxImageSizeMb * 1024 * 1024, [maxImageSizeMb])
  const giphyApiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY
  const giphyFetch = useMemo(
    () => (giphyApiKey ? new GiphyFetch(giphyApiKey) : null),
    [giphyApiKey]
  )

  const insertToken = (token: string) => {
    onChange(appendWithSpacing(value, token))
  }

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please choose an image file.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > maxImageSizeBytes) {
      toast({
        title: 'Image too large',
        description: `Maximum image size is ${maxImageSizeMb}MB.`,
        variant: 'destructive',
      })
      return
    }

    setIsUploadingImage(true)

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          if (typeof result !== 'string') {
            reject(new Error('Failed to read selected image'))
            return
          }

          const payload = result.split(',')[1]
          if (!payload) {
            reject(new Error('Invalid image data'))
            return
          }

          resolve(payload)
        }
        reader.onerror = () => reject(new Error('Failed to read selected image'))
        reader.readAsDataURL(file)
      })

      const uploaded = await uploadImage(
        base64Data,
        uploadFolder,
        `Comment image ${file.name}`,
        1600,
        1600
      )

      if (!uploaded?.url) {
        throw new Error('Upload did not return a URL')
      }

      insertToken(uploaded.url)
      toast({
        title: 'Image added',
        description: 'Image URL inserted into your comment.',
      })
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Could not upload image',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    insertToken(emojiData.emoji)
  }

  const handleGifSelect = (gif: IGif, event: React.SyntheticEvent<HTMLElement, Event>) => {
    event.preventDefault()
    const gifUrl = gif.images.fixed_height?.url || gif.images.original?.url
    if (!gifUrl) {
      toast({
        title: 'GIF unavailable',
        description: 'Selected GIF is missing a valid URL.',
        variant: 'destructive',
      })
      return
    }

    insertToken(gifUrl)
    setIsGifDialogOpen(false)
  }

  const fetchGifs = (offset: number) => {
    if (!giphyFetch) {
      return Promise.resolve({ data: [], pagination: { count: 0, offset, total_count: 0 }, meta: { status: 200, msg: 'no_api_key', response_id: '' } })
    }

    const query = gifQuery.trim()
    if (!query || query.toLowerCase() === 'trending') {
      return giphyFetch.trending({ offset, limit: 24, rating: 'pg-13' })
    }

    return giphyFetch.search(query, { offset, limit: 24, rating: 'pg-13', lang: 'en' })
  }

  return (
    <div className={cn('flex items-center gap-2 text-gray-500', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0]
          if (selectedFile) {
            void handleImageFile(selectedFile)
          }
        }}
        disabled={disabled || isUploadingImage}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('h-9 w-9 p-0', buttonClassName)}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploadingImage}
      >
        {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn('h-9 w-9 p-0', buttonClassName)}
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-2" align="start">
          <EmojiPicker
            onEmojiClick={handleEmojiSelect}
            lazyLoadEmojis={true}
            width="100%"
            height={360}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{ showPreview: false }}
          />
        </PopoverContent>
      </Popover>

      {showGif && (
        <Dialog open={isGifDialogOpen} onOpenChange={setIsGifDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('h-9 px-2 text-[11px] font-semibold', buttonClassName)}
              disabled={disabled}
            >
              GIF
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose a GIF</DialogTitle>
              <DialogDescription>
                Search and insert a GIF directly into your comment.
              </DialogDescription>
            </DialogHeader>
            {!giphyApiKey ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Set NEXT_PUBLIC_GIPHY_API_KEY in your environment to enable GIF search.
              </div>
            ) : (
              <>
                <Input
                  value={gifQuery}
                  onChange={(event) => setGifQuery(event.target.value)}
                  placeholder="Search GIFs (or use trending)"
                />
                <div className="max-h-[420px] overflow-y-auto rounded-md border">
                  <Grid
                    key={gifQuery || 'trending'}
                    width={460}
                    columns={3}
                    gutter={6}
                    fetchGifs={fetchGifs}
                    onGifClick={handleGifSelect}
                    noLink={true}
                    hideAttribution={false}
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGifDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default CommentComposerToolbar