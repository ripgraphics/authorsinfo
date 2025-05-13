'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { PhotoGalleryProps, AlbumImage } from './types';
import { PhotoGalleryHeader } from './photo-gallery-header';
import { PhotoGalleryGrid } from './photo-gallery-grid';
import { PhotoGalleryModal } from './photo-gallery-modal';
import { PhotoGalleryEmpty } from './photo-gallery-empty';
import { PhotoGalleryLoading } from './photo-gallery-loading';
import { usePhotoGallery } from './use-photo-gallery';

export function PhotoGallery({
  albumId,
  entityType,
  entityId,
  isEditable = false,
  showHeader = true,
  showStats = true,
  showShare = true,
  showTags = true,
  maxImages = 9,
  gridCols = 3,
  className = '',
}: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<AlbumImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const {
    images,
    isLoading,
    error,
    hasMore,
    loadMore,
    handleImageUpload,
    handleImageDelete,
    handleImageReorder,
    handleImageTag,
  } = usePhotoGallery({
    albumId,
    entityType,
    entityId,
    maxImages,
  });

  const handleImageClick = useCallback((image: AlbumImage) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedImage(null);
  }, []);

  const handleNextImage = useCallback(() => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIndex]);
  }, [selectedImage, images]);

  const handlePrevImage = useCallback(() => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIndex]);
  }, [selectedImage, images]);

  if (error) {
    return (
      <div className="photo-gallery__error">
        <p>Error loading gallery: {error.message}</p>
      </div>
    );
  }

  return (
    <div 
      ref={ref}
      className={`photo-gallery ${className}`}
      data-entity-type={entityType}
      data-entity-id={entityId}
    >
      {showHeader && (
        <PhotoGalleryHeader
          albumId={albumId}
          entityType={entityType}
          entityId={entityId}
          isEditable={isEditable}
          showStats={showStats}
          showShare={showShare}
          onUpload={handleImageUpload}
        />
      )}

      <AnimatePresence>
        {isLoading ? (
          <PhotoGalleryLoading />
        ) : images.length === 0 ? (
          <PhotoGalleryEmpty isEditable={isEditable} onUpload={handleImageUpload} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <PhotoGalleryGrid
              images={images}
              gridCols={gridCols}
              isEditable={isEditable}
              showTags={showTags}
              onImageClick={handleImageClick}
              onImageDelete={handleImageDelete}
              onImageReorder={handleImageReorder}
              onImageTag={handleImageTag}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {hasMore && !isLoading && (
        <div className="photo-gallery__load-more">
          <button
            onClick={loadMore}
            className="photo-gallery__load-more-button"
          >
            Load More
          </button>
        </div>
      )}

      <PhotoGalleryModal
        isOpen={isModalOpen}
        image={selectedImage}
        onClose={handleCloseModal}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
        showTags={showTags}
        isEditable={isEditable}
        onImageTag={handleImageTag}
      />
    </div>
  );
} 