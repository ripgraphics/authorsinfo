'use client'

import { useState } from 'react'
import { Reorder } from 'framer-motion'
import { PhotoGalleryGridProps } from './types'
import { PhotoGalleryImage } from './photo-gallery-image'

export function PhotoGalleryGrid({
  images,
  gridCols,
  isEditable,
  showTags,
  onImageClick,
  onImageDelete,
  onImageReorder,
  onImageTag,
}: PhotoGalleryGridProps) {
  const [isDragging, setIsDragging] = useState(false)

  const gridColsClass =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    }[gridCols] || 'grid-cols-3'

  if (isEditable) {
    return (
      <div className="photo-gallery-grid-container h-full overflow-y-auto">
        <Reorder.Group
          axis="y"
          values={images}
          onReorder={(newOrder) => {
            newOrder.forEach((image, index) => {
              if (image.displayOrder !== index + 1) {
                onImageReorder(Number(image.id), index + 1)
              }
            })
          }}
          className={`photo-gallery__grid grid gap-4 ${gridColsClass} p-4 min-h-full`}
        >
          {images.map((image) => (
            <Reorder.Item
              key={image.id}
              value={image}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              className="photo-gallery__grid-item"
            >
              <PhotoGalleryImage
                image={image}
                isEditable={isEditable}
                showTags={showTags}
                isDragging={isDragging}
                onImageClick={onImageClick}
                onImageDelete={onImageDelete}
                onImageTag={onImageTag}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    )
  }

  return (
    <div className="photo-gallery-grid-container h-full overflow-y-auto">
      <div className={`photo-gallery__grid grid gap-4 ${gridColsClass} p-4 min-h-full`}>
        {images.map((image) => (
          <div key={image.id} className="photo-gallery__grid-item">
            <PhotoGalleryImage
              image={image}
              isEditable={isEditable}
              showTags={showTags}
              onImageClick={onImageClick}
              onImageDelete={onImageDelete}
              onImageTag={onImageTag}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
