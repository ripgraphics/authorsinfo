export interface GroupInvitation {
  id: string
  group_id: string
  inviter_id: string
  invitee_email: string | null
  invitee_user_id: string | null
  role_id: number | null
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
  message: string | null
  expires_at: string | null
  accepted_at: string | null
  created_at: string
  updated_at: string
  // Expanded fields
  inviter?: {
    id: string
    name: string
    email: string
  }
  invitee?: {
    id: string
    name: string
    email: string
  }
  role?: {
    id: number
    name: string
  }
}

export interface GroupInvitationInput {
  inviteeEmail?: string
  inviteeUserId?: string
  roleId?: number | null
  message?: string | null
  expiresAt?: string | null
}
