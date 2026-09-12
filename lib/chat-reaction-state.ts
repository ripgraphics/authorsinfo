export interface ReactionEventRow {
  message_id?: string | null
  reaction?: string | null
}

export type ReactionState = Record<string, string[]>

export function applyReactionInsert(state: ReactionState, row: ReactionEventRow): ReactionState {
  if (!row.message_id || !row.reaction) return state
  const current = state[row.message_id] ?? []
  if (current.includes(row.reaction)) return state
  return { ...state, [row.message_id]: [...current, row.reaction] }
}

export function applyReactionDelete(state: ReactionState, row: ReactionEventRow): ReactionState {
  if (!row.message_id || !row.reaction) return state
  const current = state[row.message_id] ?? []
  const next = current.filter((reaction) => reaction !== row.reaction)
  if (next.length === current.length) return state
  const result = { ...state }
  if (next.length === 0) delete result[row.message_id]
  else result[row.message_id] = next
  return result
}
