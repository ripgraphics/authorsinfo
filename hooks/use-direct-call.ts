'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabaseClient } from '@/lib/supabase/client'

export type DirectCallMediaType = 'audio' | 'video'
export type DirectCallStatus = 'idle' | 'ringing' | 'incoming' | 'connecting' | 'connected' | 'ended' | 'error'

type CallSignal =
  | { type: 'offer'; callId: string; senderId: string; mediaType: DirectCallMediaType; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; callId: string; senderId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; callId: string; senderId: string; candidate: RTCIceCandidateInit }
  | { type: 'decline' | 'end'; callId: string; senderId: string }

type CapabilityResponse = {
  ready: boolean
  mode: 'direct' | 'provider'
  stun_url?: string | null
  turn_url?: string | null
}

export interface UseDirectCallOptions {
  conversationId: string | null
  currentUserId: string | null
}

export interface UseDirectCallResult {
  status: DirectCallStatus
  mediaType: DirectCallMediaType | null
  error: string | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  startCall: (mediaType: DirectCallMediaType) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => Promise<void>
  endCall: () => Promise<void>
}

const DEFAULT_STUN_URL = 'stun:stun.l.google.com:19302'

export function useDirectCall({ conversationId, currentUserId }: UseDirectCallOptions): UseDirectCallResult {
  const [status, setStatus] = useState<DirectCallStatus>('idle')
  const [mediaType, setMediaType] = useState<DirectCallMediaType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [incomingOffer, setIncomingOffer] = useState<Extract<CallSignal, { type: 'offer' }> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const callIdRef = useRef<string | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const candidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const capabilityRef = useRef<CapabilityResponse | null>(null)

  const clearPeer = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setIncomingOffer(null)
    candidateQueueRef.current = []
  }, [])

  const sendSignal = useCallback((signal: CallSignal) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'call-signal', payload: signal })
  }, [])

  const createPeer = useCallback(async (type: DirectCallMediaType) => {
    const capability = capabilityRef.current ?? await fetch('/api/messages/calls/capabilities', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<CapabilityResponse> : null)
    capabilityRef.current = capability
    if (!capability?.ready) throw new Error('Calls are unavailable.')

    const iceServers: RTCIceServer[] = [{ urls: capability.stun_url || DEFAULT_STUN_URL }]
    if (capability.turn_url) iceServers.push({ urls: capability.turn_url })
    const peer = new RTCPeerConnection({ iceServers })
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' })
    stream.getTracks().forEach((track) => peer.addTrack(track, stream))
    peer.ontrack = (event) => setRemoteStream(event.streams[0] ?? null)
    peer.onicecandidate = (event) => {
      const callId = callIdRef.current
      if (event.candidate && callId && currentUserId) {
        sendSignal({ type: 'ice-candidate', callId, senderId: currentUserId, candidate: event.candidate.toJSON() })
      }
    }
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') setStatus('connected')
      if (['failed', 'disconnected', 'closed'].includes(peer.connectionState)) setStatus('ended')
    }
    peerRef.current = peer
    localStreamRef.current = stream
    setLocalStream(stream)
    setMediaType(type)
    return peer
  }, [currentUserId, sendSignal])

  const startCall = useCallback(async (type: DirectCallMediaType) => {
    if (!conversationId || !currentUserId || status !== 'idle') return
    try {
      setError(null)
      const response = await fetch('/api/messages/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, media_type: type }),
      })
      if (!response.ok) throw new Error('Unable to start call.')
      const session = await response.json() as { id: string }
      callIdRef.current = session.id
      const peer = await createPeer(type)
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      setStatus('ringing')
      sendSignal({ type: 'offer', callId: session.id, senderId: currentUserId, mediaType: type, sdp: offer })
    } catch (caught) {
      clearPeer()
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Unable to start call.')
    }
  }, [conversationId, createPeer, currentUserId, clearPeer, sendSignal, status])

  const acceptCall = useCallback(async () => {
    if (!incomingOffer || !conversationId || !currentUserId) return
    try {
      setError(null)
      callIdRef.current = incomingOffer.callId
      const peer = await createPeer(incomingOffer.mediaType)
      await peer.setRemoteDescription(incomingOffer.sdp)
      for (const candidate of candidateQueueRef.current) await peer.addIceCandidate(candidate)
      candidateQueueRef.current = []
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      await fetch(`/api/messages/calls/${incomingOffer.callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      })
      setIncomingOffer(null)
      setStatus('connecting')
      sendSignal({ type: 'answer', callId: incomingOffer.callId, senderId: currentUserId, sdp: answer })
    } catch (caught) {
      clearPeer()
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Unable to accept call.')
    }
  }, [conversationId, createPeer, currentUserId, incomingOffer, clearPeer, sendSignal])

  const declineCall = useCallback(async () => {
    const callId = incomingOffer?.callId ?? callIdRef.current
    if (callId && currentUserId) {
      sendSignal({ type: 'decline', callId, senderId: currentUserId })
      await fetch(`/api/messages/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined', end_reason: 'declined_by_recipient' }),
      })
    }
    clearPeer()
    callIdRef.current = null
    setStatus('idle')
  }, [currentUserId, incomingOffer, clearPeer, sendSignal])

  const endCall = useCallback(async () => {
    const callId = callIdRef.current
    if (callId && currentUserId) {
      sendSignal({ type: 'end', callId, senderId: currentUserId })
      await fetch(`/api/messages/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended', end_reason: 'ended_by_user' }),
      })
    }
    clearPeer()
    callIdRef.current = null
    setStatus('idle')
  }, [currentUserId, clearPeer, sendSignal])

  useEffect(() => {
    if (!conversationId || !currentUserId) return
    const channel = supabaseClient
      .channel(`direct-call-${conversationId}`)
      .on('broadcast', { event: 'call-signal' }, ({ payload }) => {
        const signal = payload as CallSignal
        if (!signal?.callId || signal.senderId === currentUserId) return
        if (signal.type === 'offer') {
          callIdRef.current = signal.callId
          setIncomingOffer(signal)
          setMediaType(signal.mediaType)
          setStatus('incoming')
        } else if (signal.type === 'answer' && signal.callId === callIdRef.current) {
          void peerRef.current?.setRemoteDescription(signal.sdp)
          setStatus('connecting')
        } else if (signal.type === 'ice-candidate' && signal.callId === callIdRef.current) {
          if (peerRef.current?.remoteDescription) void peerRef.current.addIceCandidate(signal.candidate)
          else candidateQueueRef.current.push(signal.candidate)
        } else if (signal.type === 'decline' || signal.type === 'end') {
          clearPeer()
          callIdRef.current = null
          setStatus('ended')
        }
      })
      .subscribe()
    channelRef.current = channel
    return () => {
      channelRef.current = null
      void supabaseClient.removeChannel(channel)
      clearPeer()
    }
  }, [conversationId, currentUserId, clearPeer])

  return { status, mediaType, error, localStream, remoteStream, startCall, acceptCall, declineCall, endCall }
}
