'use client';

import { PhotoGalleryEmptyProps } from './types';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon } from 'lucide-react';

export function PhotoGalleryEmpty({
  isEditable,
  onUpload,
}: PhotoGalleryEmptyProps) {
  return (
    <div className="photo-gallery__empty flex flex-col items-center justify-center p-8 text-center">
      <div className="photo-gallery__empty-icon mb-4 rounded-full bg-muted p-4">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="photo-gallery__empty-title text-xl font-semibold mb-2">
        No Photos Yet
      </h3>
      <p className="photo-gallery__empty-description text-muted-foreground mb-6 max-w-sm">
        {isEditable
          ? 'Upload your first photo to get started. You can add multiple photos at once.'
          : 'This gallery is empty. Check back later for updates.'}
      </p>
      {isEditable && (
        <div className="photo-gallery__empty-actions">
          <input
            type="file"
            id="empty-upload"
            className="hidden"
            multiple
            accept="image/*"
            onChange={(e) => {
              console.log('Empty component file input changed')
              const files = Array.from(e.target.files || []);
              console.log('Empty component selected files:', files.length)
              
              if (files.length > 0) {
                console.log('Empty component starting upload...')
                onUpload(files).catch(error => {
                  console.error('Empty component upload error:', error)
                });
              }
              // Reset the input
              e.target.value = '';
            }}
          />
          <label htmlFor="empty-upload">
            <Button
              variant="default"
              size="lg"
              className="photo-gallery__empty-upload-button"
              onClick={() => {
                console.log('Empty upload button clicked')
                document.getElementById('empty-upload')?.click()
              }}
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Photos
            </Button>
          </label>
        </div>
      )}
    </div>
  );
} 