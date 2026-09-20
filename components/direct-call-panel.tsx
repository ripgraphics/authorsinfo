'use client'

import { PhoneOff } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import type { DirectCallMediaType, DirectCallStatus } from '@/hooks/use-direct-call'

interface DirectCallPanelProps {
  status: DirectCallStatus
  mediaType: DirectCallMediaType | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  error: string | null
  onAccept?: () => void
  onDecline?: () => void
  onEnd?: () => void
}

export function DirectCallPanel({
  status,
  mediaType,
  localStream,
  remoteStream,
  error,
  onAccept,
  onDecline,
  onEnd,
}: DirectCallPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream
  }, [localStream])

  useEffect(() => {
    if (mediaType === 'video') {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
    } else if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream
    }
  }, [mediaType, remoteStream])

  if (status === 'idle') return null

  return (
    <section className="direct-call-panel border-b bg-muted/60 p-3" aria-label="Call controls">
      {status === 'incoming' ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Incoming {mediaType ?? 'audio'} call</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={onAccept}>Answer</Button>
            <Button type="button" size="sm" variant="outline" onClick={onDecline}>Decline</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {mediaType === 'video' ? (
            <div className="grid grid-cols-2 gap-2">
              <video ref={remoteVideoRef} autoPlay playsInline className="aspect-video w-full rounded bg-black" />
              <video ref={localVideoRef} autoPlay muted playsInline className="aspect-video w-full rounded bg-black" />
            </div>
          ) : (
            <audio ref={remoteAudioRef} autoPlay />
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {error ?? (status === 'connected' ? 'Connected' : status === 'ringing' ? 'Calling...' : 'Connecting...')}
            </p>
            <Button type="button" size="sm" variant="destructive" onClick={onEnd}>
              <PhoneOff className="h-4 w-4" />
              End call
            </Button>
          </div>
        </div>
      )}
      {status === 'error' ? <p className="mt-2 text-xs text-destructive">{error ?? 'Call unavailable.'}</p> : null}
    </section>
  )
}
