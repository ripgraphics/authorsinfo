"use client"

import { Input } from "@/components/ui/input"
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Helper function to format date
function formatDate(dateString?: string): string {
  if (!dateString) return "Not specified"
  return format(new Date(dateString), 'MMMM d, yyyy')
}

import { useState, useEffect, ReactElement } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  BookOpen,
  Users,
  MapPin,
  Globe,
  Camera,
  MessageSquare,
  UserPlus,
  MoreHorizontal,
  Calendar,
  SquarePen,
  ImageIcon,
  Book,
  Star,
  Heart,
  Share2,
  Ellipsis,
  Filter,
  ChevronDown,
  PlusIcon,
  PinIcon,
  MessageSquareIcon,
  ClockIcon,
  Search,
  BookmarkIcon,
  FlagIcon,
  ThumbsUp,
  Eye,
  UserMinus,
  Trash2,
  Pencil,

} from "lucide-react"
import { FollowersList } from "@/components/followers-list"
import { EntityHeader, TabConfig } from "@/components/entity-header"
import { UserHoverCard } from "@/components/user-hover-card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useGroup, GroupProvider } from "@/contexts/GroupContext"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { uploadImage, deleteImage, getPublicIdFromUrl } from "@/app/actions/upload"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CheckCircle2,
} from "lucide-react"
import { FeedItemFooter } from "@/components/feed/FeedItemFooter"
import { getGroupInfo } from '@/utils/groupInfo';
import { EntityHoverCard } from "@/components/entity-hover-cards"
import { SidebarSection } from "@/components/ui/sidebar-section"
import { ViewFullDetailsButton } from "@/components/ui/ViewFullDetailsButton"
import { useAuth } from '@/hooks/useAuth'
import { canUserEditEntity } from '@/lib/auth-utils'

interface ClientGroupPageProps {
  group: any
  avatarUrl: string
  coverImageUrl: string
  params: {
    id: string
  }
}

export function ClientGroupPage({ group, avatarUrl, coverImageUrl, params }: ClientGroupPageProps) {
  return (
    <GroupProvider groupId={params.id}>
      <ClientGroupPageContent 
        group={group} 
        avatarUrl={avatarUrl} 
        coverImageUrl={coverImageUrl} 
        params={params} 
      />
    </GroupProvider>
  )
}

interface GroupRule {
  id?: string;  // Optional for new rules
  title: string;
  description?: string;
  order_index: number;
  group_id: string;
}

interface NewGroupRule {
  title: string;
  description?: string;
  group_id: string;
}

interface GroupCustomField {
  id: string;
  group_id: string;
  field_name: string;
  field_type: string;
  field_options: {
    value: string;
  };
  created_at: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  cover_image_url?: string;
  member_count?: number;
  group_image_id?: number;
  cover_image_id?: number;
  is_public: boolean;
  is_discoverable: boolean;
  tags?: string[];
  updated_at: string;
  creatorName?: string;
  creatorEmail?: string;
  creatorCreatedAt?: string;
  creatorJoinedAt?: string;
  contact_info?: ContactInfo;
  followers?: any[];
  creator?: {
    name: string;
  };
}

interface ContactInfo {
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

export function ClientGroupPageContent({ group: initialGroup, avatarUrl, coverImageUrl, params }: ClientGroupPageProps): ReactElement {
  const [activeTab, setActiveTab] = useState("timeline")
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const { permissions } = useGroup()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [groupRules, setGroupRules] = useState<GroupRule[]>([])
  const [editingRule, setEditingRule] = useState<GroupRule | NewGroupRule | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  // Check edit permissions
  useEffect(() => {
    const checkEditPermissions = async () => {
      if (!group?.id) {
        setCanEdit(false)
        return
      }

      // Use the new ownership function for groups
      const canEditEntity = await canUserEditEntity(
        group.created_by, 
        'group', 
        group.id
      )
      setCanEdit(canEditEntity)
    }

    checkEditPermissions()
  }, [group])

  // Add these state variables near the other state declarations
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // Update the component to include group state
  const [group, setGroup] = useState<Group>(initialGroup);

  // Add state for custom fields
  const [customFields, setCustomFields] = useState<GroupCustomField[]>([]);



  // Fetch group rules
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch(`/api/groups/${params.id}/rules`);
        if (!response.ok) {
          throw new Error('Failed to fetch rules');
        }
        const result = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }
        setGroupRules(result.data || []);
      } catch (error) {
        console.error('Error fetching rules:', error);
        toast({
          title: "Error",
          description: "Failed to load group rules",
          variant: "destructive"
        });
      }
    };
    fetchRules();
  }, [params.id, toast]);

  // Handle cover image change
  const handleCoverImageChange = () => {
    setIsCoverModalOpen(true)
  }

  // Handle profile image change
  const handleProfileImageChange = () => {
    setIsAvatarModalOpen(true)
  }

  // Handle avatar file selection
  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedAvatarFile(file)
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
    }
  }

  // Handle cover file selection
  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedCoverFile(file)
      const previewUrl = URL.createObjectURL(file)
      setCoverPreview(previewUrl)
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!selectedAvatarFile) return

    setIsUploading(true)
    try {
      // Get the old image URL and delete it from Cloudinary if it exists
      if (group.group_image_id) {
        const { data: oldImage } = await supabase
          .from('images')
          .select('url')
          .eq('id', group.group_image_id)
          .single()

        if (oldImage?.url) {
          const publicId = await getPublicIdFromUrl(oldImage.url)
          if (publicId) {
            try {
              await deleteImage(publicId)
              console.log("Old avatar deleted from Cloudinary")
            } catch (deleteError) {
              console.error("Failed to delete old avatar from Cloudinary:", deleteError)
            }
          }
        }
      }

      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string
          resolve(base64)
        }
        reader.onerror = () => {
          reject(new Error("Failed to read file"))
        }
        reader.readAsDataURL(selectedAvatarFile)
      })

      const base64Image = await base64Promise
      console.log("Base64 image prepared, uploading avatar to Cloudinary...")

      // Upload the new image to Cloudinary
      const uploadResult = await uploadImage(
        base64Image,
        "authorsinfo/group_avatar",
        `Avatar for ${group.name}`,
        400, // maxWidth for avatar
        400  // maxHeight for avatar
      )

      if (uploadResult) {
        console.log("Avatar uploaded successfully:", uploadResult.url)
        
        // Get the old image ID before updating
        const oldImageId = group.group_image_id

        // Insert into images table
        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .insert({
            url: uploadResult.url,
            alt_text: `Avatar for ${group.name}`,
            img_type_id: 29, // group_avatar
            storage_provider: 'cloudinary',
            storage_path: 'authorsinfo/group_avatar',
            original_filename: selectedAvatarFile.name,
            file_size: selectedAvatarFile.size,
            mime_type: selectedAvatarFile.type,
            is_processed: true,
            processing_status: 'completed'
          })
          .select()
          .single()

        if (imageError) {
          throw new Error(`Failed to insert image record: ${imageError.message}`)
        }

        if (imageData) {
          // Update the group with the new image ID
          const { error: updateError } = await supabase
            .from('groups')
            .update({ group_image_id: imageData.id })
            .eq('id', params.id)

          if (updateError) {
            throw new Error(`Failed to update group: ${updateError.message}`)
          }

          // Mark the old image as deleted if it exists
          if (oldImageId) {
            const { error: deleteError } = await supabase
              .from('images')
              .update({ deleted_at: new Date().toISOString() })
              .eq('id', oldImageId)

            if (deleteError) {
              console.error('Failed to mark old image as deleted:', deleteError)
            }
          }

          toast({
            title: "Success",
            description: "Group avatar updated successfully"
          })
          
          // Close modal and refresh page
          setIsAvatarModalOpen(false)
          setSelectedAvatarFile(null)
          setAvatarPreview(null)
          router.refresh()
        }
      } else {
        throw new Error("Failed to upload image - no URL returned")
      }
    } catch (error) {
      console.error("Upload error details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle cover upload
  const handleCoverUpload = async () => {
    if (!selectedCoverFile) return

    setIsUploading(true)
    try {
      // Get the old image URL and delete it from Cloudinary if it exists
      if (group.cover_image_id) {
        const { data: oldImage } = await supabase
          .from('images')
          .select('url')
          .eq('id', group.cover_image_id)
          .single()

        if (oldImage?.url) {
          const publicId = await getPublicIdFromUrl(oldImage.url)
          if (publicId) {
            try {
              await deleteImage(publicId)
              console.log("Old cover deleted from Cloudinary")
            } catch (deleteError) {
              console.error("Failed to delete old cover from Cloudinary:", deleteError)
            }
          }
        }
      }

      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string
          resolve(base64)
        }
        reader.onerror = () => {
          reject(new Error("Failed to read file"))
        }
        reader.readAsDataURL(selectedCoverFile)
      })

      const base64Image = await base64Promise
      console.log("Base64 image prepared, uploading cover to Cloudinary...")

      // Upload the new image to Cloudinary
      const uploadResult = await uploadImage(
        base64Image,
        "authorsinfo/group_cover",
        `Cover for ${group.name}`,
        1200, // maxWidth for cover
        400   // maxHeight for cover
      )

      if (uploadResult) {
        console.log("Cover uploaded successfully:", uploadResult.url)
        
        // Get the old image ID before updating
        const oldImageId = group.cover_image_id

        // Insert into images table
        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .insert({
            url: uploadResult.url,
            alt_text: `Cover for ${group.name}`,
            img_type_id: 31, // group_cover
            storage_provider: 'cloudinary',
            storage_path: 'authorsinfo/group_cover',
            original_filename: selectedCoverFile.name,
            file_size: selectedCoverFile.size,
            mime_type: selectedCoverFile.type,
            is_processed: true,
            processing_status: 'completed'
          })
          .select()
          .single()

        if (imageError) {
          throw new Error(`Failed to insert image record: ${imageError.message}`)
        }

        if (imageData) {
          // Update the group with the new image ID
          const { error: updateError } = await supabase
            .from('groups')
            .update({ cover_image_id: imageData.id })
            .eq('id', params.id)

          if (updateError) {
            throw new Error(`Failed to update group: ${updateError.message}`)
          }

          // Mark the old image as deleted if it exists
          if (oldImageId) {
            const { error: deleteError } = await supabase
              .from('images')
              .update({ deleted_at: new Date().toISOString() })
              .eq('id', oldImageId)

            if (deleteError) {
              console.error('Failed to mark old image as deleted:', deleteError)
            }
          }

          toast({
            title: "Success",
            description: "Group cover updated successfully"
          })
          
          // Close modal and refresh page
          setIsCoverModalOpen(false)
          setSelectedCoverFile(null)
          setCoverPreview(null)
          router.refresh()
        }
      } else {
        throw new Error("Failed to upload image - no URL returned")
      }
    } catch (error) {
      console.error("Upload error details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload cover",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  console.log('Group data:', {
    id: group?.id,
    name: group?.name,
    created_by: group?.created_by,
    creatorName: group?.creatorName,
    isEditable: canEdit || permissions.isOwner() || permissions.isAdmin()
  })

  // Use real group data if available
  const name = group?.name || "Unnamed Group"
  const description = group?.description || ""
  const tags = group?.tags || []
  const isPublic = group?.is_public ?? true
  const isDiscoverable = group?.is_discoverable ?? true
  const memberCount = group?.member_count || 0

  // Configure tabs for the EntityHeader
  const tabs: TabConfig[] = [
    { id: "timeline", label: "Timeline" },
    { id: "about", label: "About" },
    { id: "members", label: "Members" },
    { id: "discussions", label: "Discussions" },
    { id: "photos", label: "Photos" },
    { id: "more", label: "More" }
  ]

  // Set up stats for the EntityHeader
  const groupStats = [
    { 
      icon: <Users className="h-4 w-4 mr-1" />, 
      text: `${memberCount} members` 
    },
    {
      icon: <Globe className="h-4 w-4 mr-1" />,
      text: isPublic ? "Public" : "Private"
    },
    {
      icon: <Star className="h-4 w-4 mr-1" />,
      text: isDiscoverable ? "Discoverable" : "Hidden"
    }
  ]

  // Mock data for the profile
  const mockUsername = group?.name ? group.name.split(" ").join("").toLowerCase() : "group"
  const mockBooksRead = 127
  const mockFriendsCount = 248
  const mockLocation = "Portland, OR"
  const mockWebsite = mockUsername + ".com"
  const mockAbout =
    "Book lover, coffee addict, and aspiring writer. I read mostly fantasy, sci-fi, and literary fiction."
  const mockJoinedDate = "March 2020"

  // Mock currently reading books
  const mockCurrentlyReading = [
    {
      title: "The Name of the Wind",
      author: "Patrick Rothfuss",
      progress: 65,
      coverUrl: "/placeholder.svg?height=240&width=160",
    },
    {
      title: "Project Hail Mary",
      author: "Andy Weir",
      progress: 23,
      coverUrl: "/placeholder.svg?height=240&width=160",
    },
  ]

  // Mock photos
  const mockPhotos = [
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
  ]

  // Mock friends
  const mockFriends = [
    { id: "1", name: "Alex Thompson", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "2", name: "Maria Garcia", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "3", name: "James Wilson", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "4", name: "Emma Davis", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "5", name: "Michael Brown", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "6", name: "Sophia Martinez", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "7", name: "Daniel Lee", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "8", name: "Olivia Johnson", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "9", name: "William Smith", avatar: "/placeholder.svg?height=100&width=100" },
  ]

  // Mock activities
  const mockActivities = [
    {
      id: "1",
      type: "rating",
      bookTitle: "The Midnight Library",
      bookAuthor: "Matt Haig",
      rating: 5,
      timeAgo: "2 hours ago",
      views: 64,
      likes: 42,
      replies: 2
    },
    {
      id: "2",
      type: "finished",
      bookTitle: "Project Hail Mary",
      bookAuthor: "Andy Weir",
      timeAgo: "1 day ago",
      views: 128,
      likes: 89,
      replies: 5
    },
    {
      id: "3",
      type: "added",
      bookTitle: "Klara and the Sun",
      bookAuthor: "Kazuo Ishiguro",
      shelf: "Want to Read",
      timeAgo: "3 days ago",
      views: 256,
      likes: 156,
      replies: 12
    },
    {
      id: "4",
      type: "reviewed",
      bookTitle: "The Invisible Life of Addie LaRue",
      bookAuthor: "V.E. Schwab",
      timeAgo: "1 week ago",
      views: 512,
      likes: 324,
      replies: 28
    }
  ]

  // Mock data for friends tab
  const mockFriendsTabData = [
    {
      id: "1",
      name: "Alex Thompson",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Seattle, WA",
      mutualFriends: 15,
    },
    {
      id: "2",
      name: "Maria Garcia",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Portland, OR",
      mutualFriends: 8,
    },
    {
      id: "3",
      name: "James Wilson",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "San Francisco, CA",
      mutualFriends: 12,
    },
    {
      id: "4",
      name: "Emma Davis",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Chicago, IL",
      mutualFriends: 5,
    },
    {
      id: "5",
      name: "Michael Brown",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "New York, NY",
      mutualFriends: 10,
    },
    {
      id: "6",
      name: "Sophia Martinez",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Los Angeles, CA",
      mutualFriends: 7,
    },
    {
      id: "7",
      name: "Daniel Lee",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Boston, MA",
      mutualFriends: 9,
    },
    {
      id: "8",
      name: "Olivia Johnson",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Austin, TX",
      mutualFriends: 6,
    },
    {
      id: "9",
      name: "William Smith",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Denver, CO",
      mutualFriends: 11,
    },
  ]

  // Mock friend suggestions
  const mockFriendSuggestions = [
    { id: "101", name: "Mark Johnson", avatar: "/placeholder.svg?height=100&width=100", mutualFriends: 12 },
    { id: "102", name: "Sarah Williams", avatar: "/placeholder.svg?height=100&width=100", mutualFriends: 8 },
    { id: "103", name: "David Chen", avatar: "/placeholder.svg?height=100&width=100", mutualFriends: 5 },
  ]

  // Mock photos tab data
  const mockPhotosTabData = [
    { id: "1", title: "Reading at the park", date: "June 15, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "2", title: "My bookshelf", date: "May 22, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "3", title: "Book haul!", date: "April 10, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "4", title: "Author signing event", date: "March 5, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "5", title: "Reading nook", date: "February 18, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "6", title: "Book club meeting", date: "January 30, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "7", title: "Visiting the library", date: "December 12, 2022", url: "/placeholder.svg?height=300&width=300" },
    { id: "8", title: "New bookmarks", date: "November 5, 2022", url: "/placeholder.svg?height=300&width=300" },
    {
      id: "9",
      title: "Reading by the fireplace",
      date: "October 22, 2022",
      url: "/placeholder.svg?height=300&width=300",
    },
    { id: "10", title: "Book festival", date: "September 17, 2022", url: "/placeholder.svg?height=300&width=300" },
    { id: "11", title: "Author panel", date: "August 8, 2022", url: "/placeholder.svg?height=300&width=300" },
    { id: "12", title: "Book-themed cafe", date: "July 24, 2022", url: "/placeholder.svg?height=300&width=300" },
  ]

  // Mock discussions data
  const mockDiscussions = [
    {
      id: "1",
      title: "What are you reading this month?",
      author: "Alex Thompson",
      authorAvatar: "/placeholder.svg?height=100&width=100",
      replies: 24,
      lastReply: "2 hours ago",
      isPinned: true,
      content: "I'm currently reading 'Dune' by Frank Herbert. It's a fascinating book about a desert planet and its native inhabitants. What are you all reading?",
      views: 1200,
      likes: 100,
    },
    {
      id: "2",
      title: "Book recommendations for fantasy lovers",
      author: "Maria Garcia",
      authorAvatar: "/placeholder.svg?height=100&width=100",
      replies: 15,
      lastReply: "1 day ago",
      isPinned: false,
      content: "I'm looking for some great fantasy books to read next. Any suggestions?",
      views: 800,
      likes: 75,
    },
    {
      id: "3",
      title: "Monthly book club discussion: The Midnight Library",
      author: "James Wilson",
      authorAvatar: "/placeholder.svg?height=100&width=100",
      replies: 42,
      lastReply: "3 days ago",
      isPinned: true,
      content: "I've just finished 'The Midnight Library' by Matt Haig. It's a thought-provoking book about choices and consequences. What did you think?",
      views: 1500,
      likes: 120,
    },
    {
      id: "4",
      title: "Share your favorite quotes",
      author: "Emma Davis",
      authorAvatar: "/placeholder.svg?height=100&width=100",
      replies: 18,
      lastReply: "4 days ago",
      isPinned: false,
      content: "I've been collecting some of my favorite quotes from books. Here's one: 'The only way to do great work is to love what you do.' - Steve Jobs",
      views: 900,
      likes: 80,
    },
  ]

  // Handle rule operations
  const handleSaveRule = async (rule: GroupRule | NewGroupRule | null): Promise<void> => {
    if (!rule) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${params.id}/rules`, {
        method: 'id' in rule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rule,
          group_id: params.id,
          order_index: 'order_index' in rule ? rule.order_index : 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save rule');
      }

      const { data } = await response.json();
      
      if (data) {
        setGroupRules(prevRules => {
          if (!prevRules) return [data];
          const index = prevRules.findIndex(r => r.id === data.id);
          if (index === -1) return [...prevRules, data];
          const newRules = [...prevRules];
          newRules[index] = data;
          return newRules;
        });
        setIsRulesModalOpen(false);
        toast({
          title: "Success",
          description: "Rule saved successfully"
        });
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save rule",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId?: string) => {
    if (!ruleId) {
      toast({
        title: "Error",
        description: "Invalid rule ID",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${params.id}/rules?ruleId=${ruleId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete rule');
      }
      
      setGroupRules(rules => rules.filter(r => r.id !== ruleId));
      toast({
        title: "Rule deleted",
        description: "The group rule has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete the rule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleUpdateDescription function
  const handleUpdateDescription = async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editedDescription })
      });
      
      if (!response.ok) throw new Error('Failed to update description');
      
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      setGroup((prev: Group) => ({ ...prev, description: editedDescription }));
      setIsEditingDescription(false);
      toast({
        title: "Success",
        description: "Description updated successfully",
      });
    } catch (error) {
      console.error('Error updating description:', error);
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      });
    }
  };

  // Update the useEffect to initialize the description
  useEffect(() => {
    if (group) {
      setEditedDescription(group.description || '');
    }
  }, [group]);

  // Update the permissions check to use both systems
  const canEditGroup = canEdit || permissions.isOwner() || permissions.isAdmin();

  // Add useEffect to fetch contact info
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const groupId = params.id;
        if (!groupId) {
          throw new Error('Group ID is required');
        }

        console.log('Fetching group data for ID:', groupId);
        const groupData = await getGroupInfo(groupId);
        console.log('Group data received:', groupData);
        console.log('Contact info in group data:', groupData?.contact_info);
        setGroup(groupData);
      } catch (error) {
        console.error('Error fetching group data:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load group information",
          variant: "destructive",
        });
      }
    };
    fetchGroupData();
  }, [params.id, toast]);



  return (
    <div className="max-w-7xl mx-auto">
      <EntityHeader
        entityType="group"
        name={name}
        coverImageUrl={coverImageUrl}
        profileImageUrl={avatarUrl}
        stats={groupStats}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        creatorName={group?.creatorName}
        creator={{
          id: group?.created_by || '',
          name: group?.creatorName || '',
          email: group?.creatorEmail || '',
          created_at: group?.creatorCreatedAt || ''
        }}
        creatorJoinedAt={group?.creatorJoinedAt}
        group={group}
        isEditable={canEditGroup}
        onCoverImageChange={handleCoverImageChange}
        onProfileImageChange={handleProfileImageChange}
      />
      
      {/* Avatar Upload Modal */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Group Avatar</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-border">
              <img
                src={avatarPreview || avatarUrl || "/placeholder.svg"}
                alt="Group avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="avatar">Upload new avatar</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                disabled={isUploading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
              <Button
                variant="outline"
              onClick={() => {
                setIsAvatarModalOpen(false)
                setSelectedAvatarFile(null)
                setAvatarPreview(null)
              }}
              disabled={isUploading}
            >
              Cancel
              </Button>
            <Button
              onClick={handleAvatarUpload}
              disabled={!selectedAvatarFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
        </DialogContent>
      </Dialog>

      {/* Cover Image Upload Modal */}
      <Dialog open={isCoverModalOpen} onOpenChange={setIsCoverModalOpen}>
        <DialogContent className="cover-upload-modal">
          <DialogHeader>
            <DialogTitle>Change Group Cover</DialogTitle>
          </DialogHeader>
          <div className="cover-upload-content">
            <div className="cover-upload-preview-container">
              <div className="cover-preview-wrapper">
                <img
                  src={coverPreview || coverImageUrl || "/placeholder.svg"}
                  alt="Group cover"
                  className="cover-preview-image"
                />
                </div>
              <div className="cover-upload-input-container">
                <Label htmlFor="cover">Upload new cover</Label>
                <Input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  disabled={isUploading}
                />
                </div>
                </div>
                </div>
          <div className="cover-upload-actions">
            <Button
              variant="outline"
              onClick={() => {
                setIsCoverModalOpen(false)
                setSelectedCoverFile(null)
                setCoverPreview(null)
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCoverUpload}
              disabled={!selectedCoverFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Timeline Tab */}
      {activeTab === "timeline" && (
        <div className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Sidebar */}
            <div className="space-y-6">
                    {/* About Section */}
              <SidebarSection
                title="About"
                onViewMore={() => setActiveTab("about")}
                isExpandable
                defaultExpanded={false}
                hideToggle
                footer={
                  <ViewFullDetailsButton onClick={() => setActiveTab("about")} />
                }
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {group?.description || "No description available."}
                  </p>
                  {group?.contact_info?.website && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a
                        href={group.contact_info.website.startsWith('http') ? group.contact_info.website : `https://${group.contact_info.website}`}
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Website
                      </a>
                        </div>
                  )}
                  {group?.contact_info?.city && group?.contact_info?.country && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{group.contact_info.city}, {group.contact_info.country}</span>
                      </div>
                  )}
                </div>
              </SidebarSection>

                    {/* Friends/Followers Section */}
              <SidebarSection
                title="Followers"
                viewMoreLink={`/groups/${params.id}/followers`}
                viewMoreText="See All"
              >
                    <FollowersList
                      followers={group?.followers || []}
                      followersCount={group?.followers?.length || 0}
                      entityId={params.id}
                      entityType="group"
                  hideHeader
                  hideContainer
                    />
              </SidebarSection>

                    {/* Currently Reading Section */}
                    <Card>
                <div className="currently-reading-header">
                  <div className="currently-reading-title">Currently Reading</div>
                  <Link href="/my-books" className="currently-reading-view-all">
                          See All
                        </Link>
                      </div>
                <CardContent className="currently-reading-content">
                        {mockCurrentlyReading.map((book, index) => (
                    <div key={index} className="currently-reading-book">
                      <div className="currently-reading-book-cover">
                              <img
                          src={book.coverUrl}
                                alt={book.title}
                          className="currently-reading-book-image"
                              />
                            </div>
                      <div className="currently-reading-book-info">
                        <div className="currently-reading-book-title">{book.title}</div>
                        <div className="currently-reading-book-author">{book.author}</div>
                        <div className="currently-reading-book-progress">
                          <div className="currently-reading-progress-bar">
                            <div 
                              className="currently-reading-progress-fill"
                              style={{ width: `${book.progress}%` }}
                            />
                                </div>
                          <span className="currently-reading-progress-text">{book.progress}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Photos Section */}
                    <Card>
                      <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Photos</div>
                        <Link href="/profile/janereader/photos" className="text-sm text-primary hover:underline">
                          See All
                        </Link>
                      </div>
                      <CardContent className="p-6 pt-0">
                        <div className="grid grid-cols-3 gap-2">
                          {mockPhotos.map((photoUrl, index) => (
                            <div key={index} className="aspect-square relative rounded overflow-hidden">
                              <img
                                src={photoUrl || "/placeholder.svg"}
                                alt={`Photo ${index + 1}`}
                                className="object-cover hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Friends Section */}
                    <Card>
                      <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Friends</div>
                        <Link href="/profile/janereader/friends" className="text-sm text-primary hover:underline">
                          See All
                        </Link>
                      </div>
                      <CardContent className="p-6 pt-0">
                        <div className="grid grid-cols-3 gap-2">
                          {mockFriends.map((friend) => (
                            <Link
                              key={friend.id}
                              href={`/profile/${friend.id}`}
                              className="flex flex-col items-center text-center"
                            >
                              <span className="relative flex shrink-0 overflow-hidden rounded-full h-16 w-16 mb-1">
                                <img
                                  src={friend.avatar || "/placeholder.svg"}
                                  alt={friend.name}
                                  className="aspect-square h-full w-full"
                                />
                              </span>
                              <span className="text-xs line-clamp-1">{friend.name}</span>
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Content Area */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Post Creation Form */}
                    <Card>
                      <CardContent className="p-6 pt-6">
                        <form>
                          <div className="flex gap-3">
                            <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                              <img
                                src={avatarUrl || "/placeholder.svg?height=200&width=200"}
                                alt={group.name}
                                className="aspect-square h-full w-full"
                              />
                            </span>
                            <Textarea
                              placeholder={`Welcome to ${name}!`}
                              className="flex-1 resize-none"
                            />
                          </div>
                          <div className="flex justify-between mt-4">
                            <div className="flex gap-2">
                              <Button type="button" variant="ghost" size="sm">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Photo
                              </Button>
                              <Button type="button" variant="ghost" size="sm">
                                <Book className="h-4 w-4 mr-2" />
                                Book
                              </Button>
                              <Button type="button" variant="ghost" size="sm">
                                <Star className="h-4 w-4 mr-2" />
                                Review
                              </Button>
                            </div>
                            <Button type="submit" disabled>
                              Post
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Activity Feed */}
                    <div className="space-y-6">
                      {mockActivities.map((activity) => (
                  <Card key={activity.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex flex-col space-y-1.5 p-6 pb-3">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-3">
                                <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                                  <img
                                    src={avatarUrl || "/placeholder.svg?height=200&width=200"}
                                    alt={group.name}
                                    className="aspect-square h-full w-full"
                                  />
                                </span>
                                <div>
                                  <div className="font-medium">{name}</div>
                                  <div className="text-xs text-muted-foreground">{activity.timeAgo}</div>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <Ellipsis className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-6 pt-0 pb-3">
                            {activity.type === "rating" && (
                              <p>
                                Rated{" "}
                                <Link href="#" className="text-primary hover:underline font-medium">
                                  {activity.bookTitle}
                                </Link>{" "}
                                by {activity.bookAuthor} {activity.rating} stars
                              </p>
                            )}
                            {activity.type === "finished" && (
                              <p>
                                Finished reading{" "}
                                <Link href="#" className="text-primary hover:underline font-medium">
                                  {activity.bookTitle}
                                </Link>{" "}
                                by {activity.bookAuthor}
                              </p>
                            )}
                            {activity.type === "added" && (
                              <p>
                                Added{" "}
                                <Link href="#" className="text-primary hover:underline font-medium">
                                  {activity.bookTitle}
                                </Link>{" "}
                                by {activity.bookAuthor} to {activity.shelf}
                              </p>
                            )}
                            {activity.type === "reviewed" && (
                              <p>
                                Reviewed{" "}
                                <Link href="#" className="text-primary hover:underline font-medium">
                                  {activity.bookTitle}
                                </Link>{" "}
                                by {activity.bookAuthor}
                              </p>
                            )}
                          </div>
                    <FeedItemFooter
                      views={activity.views}
                      likeCount={activity.likes}
                      replyCount={activity.replies}
                      onLike={() => console.log('Like clicked')}
                      onReply={() => console.log('Reply clicked')}
                      onShare={() => console.log('Share clicked')}
                    />
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
        </div>
      )}

      {/* About Tab */}
      {activeTab === "about" && (
        <div className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Group Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Stats</CardTitle>
                </CardHeader>
                <CardContent>
                          <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Members</span>
                      <span className="font-medium">{group?.member_count || 0}</span>
                      </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Discussions</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Books Discussed</span>
                      <span className="font-medium">156</span>
                  </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reading Challenges</span>
                      <span className="font-medium">3</span>
                      </div>
                            </div>
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                          <div className="space-y-4">
                    {mockActivities.slice(0, 3).map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          {activity.type === "rating" ? (
                            <Star className="h-4 w-4 text-primary" />
                          ) : activity.type === "finished" ? (
                            <Book className="h-4 w-4 text-primary" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-primary" />
                          )}
                          </div>
                            <div>
                          <p className="text-sm">
                            {activity.type === "rating" ? (
                              <>Rated <span className="font-medium">{activity.bookTitle}</span> {activity.rating} stars</>
                            ) : activity.type === "finished" ? (
                              <>Finished reading <span className="font-medium">{activity.bookTitle}</span></>
                            ) : (
                              <>Added <span className="font-medium">{activity.bookTitle}</span> to {activity.shelf}</>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                            </div>
                          </div>
                    ))}
                        </div>
                </CardContent>
              </Card>

              {/* Group Tags Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {group.tags && group.tags.length > 0 ? (
                      group.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags available</p>
                    )}
                      </div>
                </CardContent>
              </Card>
                    </div>
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8 py-4">
              {/* Core Group Data Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Group Name and Creator */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <div className="text-base">{group.name}</div>
                      <div className="text-muted-foreground truncate text-sm">
                        Created by{" "}
                        <EntityHoverCard
                          type="group"
                          entity={{
                            id: group.created_by || '',
                            name: group.creatorName || 'Unknown',
                            group_image: {
                              url: `/api/avatar/${group.created_by}`
                            },
                            joined_at: group.creatorJoinedAt
                          }}
                        >
                          <span className="cursor-pointer">{group.creatorName || 'Unknown'}</span>
                        </EntityHoverCard>
                      </div>
                              </div>

                    {/* Privacy Settings */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Privacy Settings</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Is Private</Label>
                          <div className="text-base">{group.is_private ? 'Yes' : 'No'}</div>
                              </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Is Public</Label>
                          <div className="text-base">{group.is_public ? 'Yes' : 'No'}</div>
                            </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Is Discoverable</Label>
                          <div className="text-base">{group.is_discoverable ? 'Yes' : 'No'}</div>
                              </div>
                              </div>
                            </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Stats</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Member Count</Label>
                          <div className="text-base">{group.member_count || 0}</div>
                          </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Created At</Label>
                          <div className="text-base">{new Date(group.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Last Updated</Label>
                          <div className="text-base">{new Date(group.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                              </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Creator Joined</Label>
                          <div className="text-base">{group.creatorJoinedAt ? new Date(group.creatorJoinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
                              </div>
                            </div>
                              </div>
                              </div>
                </CardContent>
              </Card>

              {/* Description Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Description</CardTitle>
                  {canEditGroup && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingDescription(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditingDescription ? (
                        <div className="space-y-4">
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        placeholder="Enter group description"
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setIsEditingDescription(false);
                          setEditedDescription(group.description || '');
                        }}>
                          Cancel
                              </Button>
                        <Button onClick={handleUpdateDescription}>
                          Save Changes
                              </Button>
                            </div>
                          </div>
                  ) : (
                    <p className="text-gray-600">{group.description || "No description provided."}</p>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    console.log('Rendering contact info. Group:', group);
                    console.log('Group contact_info:', group?.contact_info);
                    return group?.contact_info ? (
                    <div className="space-y-6">
                      {/* Basic Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.contact_info.email && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                            <div className="flex items-center space-x-2">
                              <span>{group.contact_info.email}</span>
                            </div>
                          </div>
                        )}
                        {group.contact_info.phone && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                            <div className="flex items-center space-x-2">
                              <span>{group.contact_info.phone}</span>
                            </div>
                          </div>
                        )}
                        {group.contact_info.website && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                            <div className="flex items-center space-x-2">
                              <a 
                                href={group.contact_info.website.startsWith('http') ? group.contact_info.website : `https://${group.contact_info.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {group.contact_info.website}
                              </a>
                            </div>
                          </div>
                        )}
                        </div>

                      {/* Address Information */}
                      {(group.contact_info.address_line1 || group.contact_info.address_line2 || 
                        group.contact_info.city || group.contact_info.state || 
                        group.contact_info.postal_code || group.contact_info.country) && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                          <div className="space-y-1">
                            {group.contact_info.address_line1 && (
                              <div className="text-sm">{group.contact_info.address_line1}</div>
                            )}
                            {group.contact_info.address_line2 && (
                              <div className="text-sm">{group.contact_info.address_line2}</div>
                            )}
                            <div className="text-sm">
                              {[
                                group.contact_info.city,
                                group.contact_info.state,
                                group.contact_info.postal_code
                              ].filter(Boolean).join(', ')}
                            </div>
                            {group.contact_info.country && (
                              <div className="text-sm">{group.contact_info.country}</div>
                            )}
                            </div>
                          </div>
                      )}

                      {/* Metadata */}
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Created</Label>
                            <div>{formatDate(group.contact_info.created_at)}</div>
                            </div>
                            <div className="space-y-1">
                            <Label className="text-xs font-medium">Updated</Label>
                            <div>{formatDate(group.contact_info.updated_at)}</div>
                              </div>
                              </div>
                            </div>
                            </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No contact information available for this group.</p>
                          </div>
                  );
                  })()}
                </CardContent>
              </Card>

              {/* Group Rules Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Group Rules</CardTitle>
                  {canEditGroup && (
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingRule({
                        title: '',
                        description: '',
                        group_id: params.id
                      });
                      setIsRulesModalOpen(true);
                    }}>
                      Add Rule
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {groupRules.length === 0 ? (
                      <p className="text-gray-500 italic">No rules have been set for this group.</p>
                    ) : (
                      groupRules.map((rule) => (
                        <div key={rule.id} className="flex items-start justify-between">
                            <div>
                            <h4 className="font-medium">{rule.title}</h4>
                            {rule.description && (
                              <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                            )}
                            </div>
                          {canEditGroup && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => {
                                setEditingRule(rule);
                                setIsRulesModalOpen(true);
                              }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          </div>
                      ))
                    )}
                        </div>
                </CardContent>
              </Card>
                      </div>
                    </div>
                      </div>
      )}

      {/* Discussions Tab */}
      {activeTab === "discussions" && (
        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
                        <div className="space-y-6">
              {/* Popular Topics */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['Book Recommendations', 'Reading Challenges', 'Author Events', 'Book Reviews', 'Reading Tips'].map((topic, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{topic}</span>
                        <Badge variant="secondary">{Math.floor(Math.random() * 100)}</Badge>
                            </div>
                    ))}
                              </div>
                </CardContent>
              </Card>

              {/* Active Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockFriends.slice(0, 5).map((friend) => (
                      <div key={friend.id} className="flex items-center gap-3">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{friend.name}</p>
                          <p className="text-xs text-muted-foreground">Active now</p>
                            </div>
                              </div>
                    ))}
                            </div>
                </CardContent>
              </Card>

              {/* Discussion Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle>Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                      <span>Be respectful and kind to others</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                      <span>Stay on topic and relevant to books</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                      <span>No spoilers without warning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                      <span>Share your thoughts and experiences</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
                          </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Section */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Discussions</h2>
                    <p className="text-sm text-muted-foreground">
                      Join the conversation with {group?.member_count || 0} members
                              </p>
                            </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      New Discussion
                    </Button>
                          </div>
                        </div>
                
                {/* Search and Filter Bar */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search discussions..." className="pl-8" />
                      </div>
                  <Select defaultValue="recent">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="comments">Most Comments</SelectItem>
                      <SelectItem value="views">Most Views</SelectItem>
                    </SelectContent>
                  </Select>
                    </div>
                      </div>

              {/* Categories Tabs */}
              <div className="border-b">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pinned">Pinned</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    {/* Content for "all" tab */}
                  </TabsContent>
                  <TabsContent value="pinned">
                    {/* Content for "pinned" tab */}
                  </TabsContent>
                  <TabsContent value="announcements">
                    {/* Content for "announcements" tab */}
                  </TabsContent>
                  <TabsContent value="questions">
                    {/* Content for "questions" tab */}
                  </TabsContent>
                  <TabsContent value="events">
                    {/* Content for "events" tab */}
                  </TabsContent>
                </Tabs>
                            </div>

              {/* Discussions List */}
              <div className="space-y-4">
                {mockDiscussions.map((discussion, index) => (
                  <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium hover:text-primary cursor-pointer">
                                {discussion.title}
                              </h3>
                              {discussion.isPinned && (
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                                  <PinIcon className="h-3 w-3 mr-1" />
                                  Pinned
                              </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <img
                                  src={discussion.authorAvatar}
                                  alt={discussion.author}
                                  className="h-5 w-5 rounded-full"
                                />
                                <span className="font-medium text-foreground">{discussion.author}</span>
                            </div>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <MessageSquareIcon className="h-4 w-4" />
                                <span>{discussion.replies} replies</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4" />
                                <span>Last reply {discussion.lastReply}</span>
                            </div>
                          </div>
                        </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Ellipsis className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <BookmarkIcon className="h-4 w-4 mr-2" />
                                Save
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FlagIcon className="h-4 w-4 mr-2" />
                                Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                        <div className="mt-4 text-sm text-muted-foreground">
                          {discussion.content}
                      </div>
                      </div>
                      <FeedItemFooter
                        views={discussion.views}
                        likeCount={discussion.likes}
                        replyCount={discussion.replies}
                        onLike={() => console.log('Like clicked')}
                        onReply={() => console.log('Reply clicked')}
                        onShare={() => console.log('Share clicked')}
                      />
                    </CardContent>
                  </Card>
                ))}
                    </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing 1-10 of 24 discussions
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                              </Button>
                            </div>
                          </div>
                      </div>
                </div>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === "photos" && (
        <div className="mt-6">
                <div className="space-y-6">
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="flex justify-between items-center">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Photos</div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            role="combobox"
                            aria-controls="radix-:rk:"
                            aria-expanded="false"
                            aria-autocomplete="none"
                            dir="ltr"
                            data-state="closed"
                            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[180px]"
                          >
                            <span style={{ pointerEvents: "none" }}>All Photos</span>
                            <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                          </Button>
                          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Add Photos
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6 pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {mockPhotosTabData.map((photo) => (
                          <div key={photo.id} className="group relative">
                            <div className="aspect-square relative rounded-lg overflow-hidden">
                              <img
                                alt={photo.title}
                                src={photo.url || "/placeholder.svg"}
                                className="object-cover group-hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                              <div className="p-3 text-white w-full">
                                <p className="text-sm truncate">{photo.title}</p>
                                <p className="text-xs opacity-80">{photo.date}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
        </div>
      )}

      {/* More Tab */}
      {activeTab === "more" && (
        <div className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="text-2xl font-semibold leading-none tracking-tight">Groups</div>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Fantasy Book Club"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Fantasy Book Club</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Moderator
                            </div>
                            <span>·</span>
                            <span>1243 members</span>
                            <span>·</span>
                            <span>Joined January 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Science Fiction Readers"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Science Fiction Readers</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>3567 members</span>
                            <span>·</span>
                            <span>Joined March 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Portland Book Lovers"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Portland Book Lovers</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>567 members</span>
                            <span>·</span>
                            <span>Joined April 2020</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Women Writers Book Club"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Women Writers Book Club</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>892 members</span>
                            <span>·</span>
                            <span>Joined September 2022</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Literary Fiction Fans"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Literary Fiction Fans</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>1456 members</span>
                            <span>·</span>
                            <span>Joined July 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Classic Literature Society"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Classic Literature Society</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>789 members</span>
                            <span>·</span>
                            <span>Joined February 2022</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <Button className="h-10 px-4 py-2 w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Find More Groups
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="text-2xl font-semibold leading-none tracking-tight">Pages</div>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Brandon Sanderson"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Brandon Sanderson</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Author
                            </div>
                            <span>·</span>
                            <span>Following Since 2020</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Tor Books"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Tor Books</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Publisher
                            </div>
                            <span>·</span>
                            <span>Following Since 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Powell's Books"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Powell&apos;s Books</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Bookstore
                            </div>
                            <span>·</span>
                            <span>Following Since 2019</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Neil Gaiman"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Neil Gaiman</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Author
                            </div>
                            <span>·</span>
                            <span>Following Since 2020</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Penguin Random House"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Penguin Random House</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Publisher
                            </div>
                            <span>·</span>
                            <span>Following Since 2022</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Barnes & Noble"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Barnes & Noble</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Bookstore
                            </div>
                            <span>·</span>
                            <span>Following Since 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <Button className="h-10 px-4 py-2 w-full">
                        <Book className="h-4 w-4 mr-2" />
                        Discover More Pages
                      </Button>
                    </div>
                  </div>
                </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Member Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Member Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Members</span>
                      <span className="font-medium">{group?.member_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">New This Week</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Now</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Moderators</span>
                      <span className="font-medium">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Member Roles Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Member Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                        <span className="text-sm">Owners</span>
                      </div>
                      <span className="text-sm font-medium">1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Admins</span>
                      </div>
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Moderators</span>
                      </div>
                      <span className="text-sm font-medium">3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                        <span className="text-sm">Members</span>
                      </div>
                      <span className="text-sm font-medium">{group?.member_count ? group.member_count - 6 : 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Member Activity Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockFriends.slice(0, 5).map((friend) => (
                      <div key={friend.id} className="flex items-center gap-3">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{friend.name}</p>
                          <p className="text-xs text-muted-foreground">Active now</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Section */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Members</h2>
                    <p className="text-sm text-muted-foreground">
                      {group?.member_count || 0} members in this group
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    {canEditGroup && (
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Members
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Search and Filter Bar */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search members..." className="pl-8" />
                  </div>
                  <Select defaultValue="recent">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently Joined</SelectItem>
                      <SelectItem value="active">Most Active</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Role Tabs */}
              <div className="border-b">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList>
                    <TabsTrigger value="all">All Members</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                    <TabsTrigger value="moderators">Moderators</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    {/* Content for "all" tab */}
                  </TabsContent>
                  <TabsContent value="admins">
                    {/* Content for "admins" tab */}
                  </TabsContent>
                  <TabsContent value="moderators">
                    {/* Content for "moderators" tab */}
                  </TabsContent>
                  <TabsContent value="members">
                    {/* Content for "members" tab */}
              </TabsContent>
            </Tabs>
          </div>

              {/* Members List */}
              <div className="space-y-4">
                {mockFriends.map((member) => (
                  <Card key={member.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-12 w-12 rounded-full"
                          />
                          <div>
                            <h3 className="font-medium">{member.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Member since Jan 2023</span>
                              <span>•</span>
                              <span>Active now</span>
        </div>
      </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Ellipsis className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Friend
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FlagIcon className="h-4 w-4 mr-2" />
                                Report
                              </DropdownMenuItem>
                              {canEditGroup && (
                                <>
                                  <DropdownMenuItem>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Make Moderator
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Remove Member
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing 1-10 of {group?.member_count || 0} members
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Edit Modal */}
      <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Add Rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editingRule?.title || ''}
                onChange={(e) => setEditingRule(prev => prev ? { ...prev, title: e.target.value } : { title: e.target.value, group_id: params.id })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={editingRule?.description || ''}
                onChange={(e) => setEditingRule(prev => prev ? { ...prev, description: e.target.value } : { title: '', description: e.target.value, group_id: params.id })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRulesModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSaveRule(editingRule)}
              disabled={isLoading || !editingRule?.title}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}