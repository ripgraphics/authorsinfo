export interface Group {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  cover_image_url?: string;
  member_count?: number;
}

export interface ContactInfo {
  id: string;
  entity_type: string;
  entity_id: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupFollower {
  id: string;
  name: string;
  avatar?: string;
}

export interface GroupRule {
  id?: string;
  title: string;
  description?: string;
  order_index: number;
  group_id: string;
}

export interface GroupCustomField {
  id: string;
  group_id: string;
  field_name: string;
  field_type: string;
  field_options: {
    value: string;
  };
  created_at: string;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  status: 'active' | 'inactive';
}

export interface GroupActivity {
  id: string;
  type: 'rating' | 'finished' | 'added' | 'reviewed';
  bookTitle: string;
  bookAuthor: string;
  rating?: number;
  timeAgo: string;
  views: number;
  likes: number;
  replies: number;
  shelf?: string;
}

export interface GroupDiscussion {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  replies: number;
  lastReply: string;
  isPinned: boolean;
  content: string;
  views: number;
  likes: number;
} 