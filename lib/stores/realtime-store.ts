import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@supabase/supabase-js'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UserPresence {
  userId: string
  status: 'online' | 'offline' | 'away'
  lastSeen: string
  typing: boolean
}

interface ActivityStreamEntry {
  id: string
  userId: string
  type: string
  title: string
  description: string
  entityType: string
  entityId: string
  visibility: 'public' | 'friends' | 'private'
  metadata: Record<string, any>
  createdAt: string
}

interface RealtimeState {
  // State
  isConnected: boolean
  connectionError: string | null
  userPresence: Map<string, UserPresence>
  activityFeed: ActivityStreamEntry[]
  onlineUserCount: number
  
  // Actions
  initialize: (userId: string) => Promise<void>
  subscribeToPresence: () => void
  subscribeToActivity: () => void
  updatePresence: (status: 'online' | 'offline' | 'away', typing: boolean) => Promise<void>
  addActivity: (activity: Omit<ActivityStreamEntry, 'id' | 'createdAt'>) => Promise<void>
  disconnect: () => void
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: any = null
let presenceChannel: RealtimeChannel | null = null
let activityChannel: RealtimeChannel | null = null

export const useRealtimeStore = create<RealtimeState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      connectionError: null,
      userPresence: new Map(),
      activityFeed: [],
      onlineUserCount: 0,

      initialize: async (userId: string) => {
        try {
          if (!supabase) {
            supabase = createClient(supabaseUrl, supabaseAnonKey)
          }

          set({ isConnected: true, connectionError: null })
          
          // Initial presence broadcast
          await get().updatePresence('online', false)
          
          // Subscribe to channels
          get().subscribeToPresence()
          get().subscribeToActivity()
        } catch (error: any) {
          set({ 
            isConnected: false, 
            connectionError: error.message 
          })
        }
      },

      subscribeToPresence: () => {
        if (!supabase) return

        presenceChannel = supabase.channel('user-presence', {
          config: {
            broadcast: { self: true },
            presence: { key: 'user-presence' },
          },
        })

        if (!presenceChannel) return

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel?.presenceState()
            if (state) {
              const presenceMap = new Map<string, UserPresence>()
              Object.entries(state).forEach(([_, presences]: any) => {
                presences.forEach((presence: any) => {
                  presenceMap.set(presence.userId, {
                    userId: presence.userId,
                    status: presence.status,
                    lastSeen: presence.lastSeen,
                    typing: presence.typing,
                  })
                })
              })
              set({
                userPresence: presenceMap,
                onlineUserCount: presenceMap.size,
              })
            }
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            const current = get().userPresence
            newPresences.forEach((presence: any) => {
              current.set(presence.userId, {
                userId: presence.userId,
                status: presence.status,
                lastSeen: presence.lastSeen,
                typing: presence.typing,
              })
            })
            set({
              userPresence: current,
              onlineUserCount: current.size,
            })
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            const current = get().userPresence
            leftPresences.forEach((presence: any) => {
              current.delete(presence.userId)
            })
            set({
              userPresence: current,
              onlineUserCount: current.size,
            })
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              const userId = (await supabase.auth.getSession()).data.session?.user?.id
              if (userId) {
                await presenceChannel?.track({
                  userId,
                  status: 'online',
                  lastSeen: new Date().toISOString(),
                  typing: false,
                })
              }
            }
          })
      },

      subscribeToActivity: () => {
        if (!supabase) return

        activityChannel = supabase.channel('activity-stream', {
          config: {
            broadcast: { self: true },
          },
        })

        if (!activityChannel) return

        activityChannel
          .on('broadcast', { event: 'new_activity' }, ({ payload }) => {
            set((state) => ({
              activityFeed: [payload.activity, ...state.activityFeed].slice(0, 100),
            }))
          })
          .subscribe()
      },

      updatePresence: async (
        status: 'online' | 'offline' | 'away',
        typing: boolean
      ) => {
        if (!presenceChannel) return

        const session = await supabase.auth.getSession()
        const userId = session.data.session?.user?.id

        if (userId) {
          await presenceChannel.track({
            userId,
            status,
            lastSeen: new Date().toISOString(),
            typing,
          })
        }
      },

      addActivity: async (
        activity: Omit<ActivityStreamEntry, 'id' | 'createdAt'>
      ) => {
        if (!supabase || !activityChannel) return

        const newActivity: ActivityStreamEntry = {
          ...activity,
          id: Math.random().toString(36).slice(2),
          createdAt: new Date().toISOString(),
        }

        // Insert into database
        const { error } = await supabase
          .from('activity_stream')
          .insert([
            {
              user_id: newActivity.userId,
              type: newActivity.type,
              title: newActivity.title,
              description: newActivity.description,
              entity_type: newActivity.entityType,
              entity_id: newActivity.entityId,
              visibility: newActivity.visibility,
              metadata: newActivity.metadata,
            },
          ])

        if (!error) {
          // Broadcast to other clients
          await activityChannel.send({
            type: 'broadcast',
            event: 'new_activity',
            payload: { activity: newActivity },
          })

          set((state) => ({
            activityFeed: [newActivity, ...state.activityFeed].slice(0, 100),
          }))
        }
      },

      disconnect: () => {
        if (presenceChannel) {
          presenceChannel.unsubscribe()
          presenceChannel = null
        }
        if (activityChannel) {
          activityChannel.unsubscribe()
          activityChannel = null
        }
        set({ isConnected: false })
      },
    }),
    {
      name: 'realtime-store',
      partialize: (state) => ({
        activityFeed: state.activityFeed,
      }),
    }
  )
)
