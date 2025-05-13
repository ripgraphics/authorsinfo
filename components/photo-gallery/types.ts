export type EntityType = 'book' | 'author' | 'publisher' | 'event' | 'group' | 'user' | 'personal';

export interface AlbumImage {
  id: string;
  url: string;
  filename: string;
  filePath: string;
  size: number;
  type: string;
  metadata: {
    width: number;
    height: number;
    uploaded_at: string;
    [key: string]: any;
  };
  albumId?: string;
  entityType?: string;
  entityId?: string;
  altText?: string;
  caption?: string;
  tags?: Array<{
    id: string;
    name: string;
  }>;
  isFeatured?: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  coverImageId?: string;
  metadata: {
    totalImages: number;
    totalSize: number;
    lastModified: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface ProcessedImage {
  original: ImageVariant;
  thumbnail: ImageVariant;
  medium: ImageVariant;
  large: ImageVariant;
  metadata: Record<string, any>;
}

export interface ShareLink {
  id: string;
  token: string;
  expiresAt: string;
  maxViews?: number;
  password?: string;
  views: number;
  lastViewedAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface ImageEdit {
  id: string;
  type: 'rotate' | 'crop' | 'filter' | 'adjust';
  params: Record<string, any>;
}

export interface AnalyticsEvent {
  type: 'view' | 'click' | 'share' | 'download' | 'like';
  albumId: string;
  imageId?: string;
  metadata?: Record<string, any>;
}

export interface ImageTag {
  id: string;
  name: string;
  slug: string;
}

export interface PhotoGalleryProps {
  albumId?: string;
  entityType: EntityType;
  entityId: string;
  isEditable?: boolean;
  showHeader?: boolean;
  showStats?: boolean;
  showShare?: boolean;
  showTags?: boolean;
  maxImages?: number;
  gridCols?: number;
  className?: string;
}

export interface PhotoGalleryHeaderProps {
  albumId?: string;
  entityType: EntityType;
  entityId: string;
  isEditable: boolean;
  showStats: boolean;
  showShare: boolean;
  onUpload: (files: File[]) => Promise<void>;
}

export interface PhotoGalleryGridProps {
  images: AlbumImage[];
  gridCols: number;
  isEditable: boolean;
  showTags: boolean;
  onImageClick: (image: AlbumImage) => void;
  onImageDelete: (imageId: number) => Promise<void>;
  onImageReorder: (imageId: number, newOrder: number) => Promise<void>;
  onImageTag: (imageId: number, tags: string[]) => Promise<void>;
}

export interface PhotoGalleryModalProps {
  isOpen: boolean;
  image: AlbumImage | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  showTags: boolean;
  isEditable: boolean;
  onImageTag: (imageId: number, tags: string[]) => Promise<void>;
}

export interface PhotoGalleryEmptyProps {
  isEditable: boolean;
  onUpload: (files: File[]) => Promise<void>;
}

export interface PhotoGalleryLoadingProps {
  gridCols?: number;
}

export interface UsePhotoGalleryProps {
  albumId?: string;
  entityType: EntityType;
  entityId: string;
  maxImages: number;
}

export interface UsePhotoGalleryReturn {
  images: AlbumImage[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  handleImageUpload: (files: File[]) => Promise<void>;
  handleImageDelete: (imageId: number) => Promise<void>;
  handleImageReorder: (imageId: number, newOrder: number) => Promise<void>;
  handleImageTag: (imageId: number, tags: string[]) => Promise<void>;
} 