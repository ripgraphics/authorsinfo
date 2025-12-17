"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

function getColorFromId(id: string) {
  // Simple hash to color
  const colors = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#38bdf8", "#facc15"]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function CollaborativeEditor({ groupId, contentId, initialBody, user }: { groupId: string, contentId: string, initialBody: string, user: { id: string, name: string } }) {
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [presence, setPresence] = useState<any>({})
  const [cursor, setCursor] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = useRef<any>(null)
  const channel = useRef<any>(null)
  const [typing, setTyping] = useState(false)
  const typingTimeout = useRef<any>(null)
  const [selection, setSelection] = useState({ start: 0, end: 0 })

  // Broadcast presence (user, cursor, typing, selection)
  useEffect(() => {
    supabase.current = createClient()
    channel.current = supabase.current.channel(`group_content_${contentId}_presence`, {
      config: { presence: { key: user.id } }
    })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.current.presenceState()
        setPresence(state)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any }) => {
        setPresence((prev: any) => ({ ...prev, [key]: newPresences }))
      })
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        setPresence((prev: any) => {
          const copy = { ...prev }
          delete copy[key]
          return copy
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'group_content', filter: `id=eq.${contentId}` }, (payload: any) => {
        if (payload.new.body !== body) {
          setBody(payload.new.body)
          setStatus('Updated by another user')
        }
      })
      .subscribe(async (status: any) => {
        await channel.current.track({
          user_id: user.id,
          name: user.name,
          cursor,
          typing: false,
          selectionStart: selection.start,
          selectionEnd: selection.end,
        })
      })
    return () => {
      if (channel.current) supabase.current.removeChannel(channel.current)
    }
  }, [contentId, user.id])

  // Update presence on cursor move, typing, and selection
  const handleCursor = (e: any) => {
    setCursor(e.target.selectionStart)
    setSelection({ start: e.target.selectionStart, end: e.target.selectionEnd })
    if (channel.current) {
      channel.current.track({
        user_id: user.id,
        name: user.name,
        cursor: e.target.selectionStart,
        typing,
        selectionStart: e.target.selectionStart,
        selectionEnd: e.target.selectionEnd,
      })
    }
  }

  const handleChange = (e: any) => {
    setBody(e.target.value)
    setStatus('Editing...')
    setTyping(true)
    setSelection({ start: e.target.selectionStart, end: e.target.selectionEnd })
    if (channel.current) {
      channel.current.track({
        user_id: user.id,
        name: user.name,
        cursor,
        typing: true,
        selectionStart: e.target.selectionStart,
        selectionEnd: e.target.selectionEnd,
      })
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      setTyping(false)
      if (channel.current) {
        channel.current.track({
          user_id: user.id,
          name: user.name,
          cursor,
          typing: false,
          selectionStart: selection.start,
          selectionEnd: selection.end,
        })
      }
    }, 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    setStatus('Saving...')
    const { error } = await supabase.current
      .from('group_content')
      .update({ body })
      .eq('id', contentId)
    setSaving(false)
    setStatus(error ? 'Error saving' : 'Saved!')
  }

  // Render avatars for presence
  const users = Object.values(presence).flat().filter((p: any) => p.user_id !== user.id)

  return (
    <div className="space-y-2">
      {/* Live selection highlights */}
      {users.map((u: any) => (
        u.selectionStart !== undefined && u.selectionEnd !== undefined && u.selectionStart !== u.selectionEnd ? (
          <div key={u.user_id + "-sel"} className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: getColorFromId(u.user_id) }}></span>
            <span className="text-xs" style={{ color: getColorFromId(u.user_id) }}>{u.name}</span>
            <span className="ml-1 text-xs" style={{ color: getColorFromId(u.user_id) }}>
              selected [{u.selectionStart}-{u.selectionEnd}]
            </span>
            <div className="h-2 rounded-sm opacity-40" style={{ background: getColorFromId(u.user_id), width: Math.max(20, Math.abs(u.selectionEnd - u.selectionStart) * 2) }} />
          </div>
        ) : null
      ))}
      <div className="flex gap-2 mb-1">
        <div className="text-xs text-gray-500">Active users:</div>
        {users.length === 0 && <span className="text-xs text-gray-400">Just you</span>}
        {users.map((u: any) => (
          <span key={u.user_id} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: getColorFromId(u.user_id) }}></span>
            <span className="text-xs" style={{ color: getColorFromId(u.user_id) }}>{u.name}</span>
            {u.typing && <span className="ml-1 text-xs text-blue-500 animate-pulse">is typing...</span>}
          </span>
        ))}
      </div>
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={handleChange}
        onSelect={handleCursor}
        rows={10}
        className="font-mono"
      />
      {/* Show cursor avatars (approximate, since textarea can't show inline avatars) */}
      {users.map((u: any) => (
        <div key={u.user_id} className="text-xs flex items-center gap-1 mt-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: getColorFromId(u.user_id) }}></span>
          <span style={{ color: getColorFromId(u.user_id) }}>{u.name}</span>
          <span className="ml-1">cursor at {u.cursor}</span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>Save</Button>
        {status && <span className="text-xs text-gray-500">{status}</span>}
      </div>
    </div>
  )
} 