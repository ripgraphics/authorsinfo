'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoGalleryModalProps } from './types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, Tag, Download, Share2 } from 'lucide-react';
import { CloseButton } from '@/components/ui/close-button';

export function PhotoGalleryModal({
  isOpen,
  image,
  onClose,
  onNext,
  onPrev,
  showTags,
  isEditable,
  onImageTag,
}: PhotoGalleryModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="photo-gallery__modal max-w-7xl p-0">
        <div className="photo-gallery__modal-content relative">
          {/* Close button */}
                     <CloseButton
             onClick={onClose}
             className="absolute right-4 top-4 z-10"
           />

          {/* Navigation buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="photo-gallery__modal-nav photo-gallery__modal-nav--prev absolute left-4 top-1/2 z-10 -translate-y-1/2"
            onClick={onPrev}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="photo-gallery__modal-nav photo-gallery__modal-nav--next absolute right-4 top-1/2 z-10 -translate-y-1/2"
            onClick={onNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Image */}
          <div className="photo-gallery__modal-image-wrapper relative aspect-[4/3] w-full">
            <Image
              src={image.url}
              alt={image.altText || ''}
              fill
              className="photo-gallery__modal-image object-contain"
              priority
              sizes="(max-width: 768px) 100vw, 90vw"
            />
          </div>

          {/* Image info */}
          <div className="photo-gallery__modal-info p-4">
            <div className="photo-gallery__modal-actions flex items-center justify-between">
              <div className="photo-gallery__modal-actions-left flex items-center gap-2">
                {isEditable && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="photo-gallery__modal-action-button"
                    onClick={() => {
                      // Handle tag editing
                    }}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Edit Tags
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="photo-gallery__modal-action-button"
                  onClick={() => {
                    // Handle download
                    window.open(image.url, '_blank');
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="photo-gallery__modal-action-button"
                  onClick={() => {
                    // Handle share
                    navigator.share({
                      title: image.altText,
                      text: image.caption,
                      url: image.url,
                    });
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Caption and tags */}
            <div className="photo-gallery__modal-details mt-4">
              {image.caption && (
                <p className="photo-gallery__modal-caption text-sm text-muted-foreground">
                  {image.caption}
                </p>
              )}
              {showTags && image.tags && image.tags.length > 0 && (
                <div className="photo-gallery__modal-tags mt-2 flex flex-wrap gap-2">
                  {image.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="photo-gallery__modal-tag"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 