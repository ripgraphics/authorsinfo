import { useCallback, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { AlbumImage } from '../types';

interface ImageEdit {
  id: string;
  type: 'rotate' | 'crop' | 'filter' | 'adjust';
  params: Record<string, any>;
}

interface EditorState {
  currentEdit: ImageEdit | null;
  history: ImageEdit[];
  isProcessing: boolean;
  error: string | null;
}

export function usePhotoGalleryEditor() {
  const [editorState, setEditorState] = useState<EditorState>({
    currentEdit: null,
    history: [],
    isProcessing: false,
    error: null,
  });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const applyEdit = useCallback(async (image: AlbumImage, edit: ImageEdit) => {
    setEditorState((prev) => ({
      ...prev,
      isProcessing: true,
      error: null,
    }));

    try {
      // Create a canvas element for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Load the image
      const img = new Image();
      img.src = (image as any).url || '';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply the edit based on type
      switch (edit.type) {
        case 'rotate': {
          const { angle } = edit.params;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((angle * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          break;
        }
        case 'crop': {
          const { x, y, width, height } = edit.params;
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, -x, -y);
          break;
        }
        case 'filter': {
          const { filter } = edit.params;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          switch (filter) {
            case 'grayscale':
              for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
              }
              break;
            case 'sepia':
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
              }
              break;
            // Add more filters as needed
          }
          
          ctx.putImageData(imageData, 0, 0);
          break;
        }
        case 'adjust': {
          const { brightness, contrast, saturation } = edit.params;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            // Apply brightness
            if (brightness !== 0) {
              data[i] += brightness;
              data[i + 1] += brightness;
              data[i + 2] += brightness;
            }
            
            // Apply contrast
            if (contrast !== 0) {
              const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
              data[i] = factor * (data[i] - 128) + 128;
              data[i + 1] = factor * (data[i + 1] - 128) + 128;
              data[i + 2] = factor * (data[i + 2] - 128) + 128;
            }
            
            // Apply saturation
            if (saturation !== 0) {
              const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
              data[i] = gray + (data[i] - gray) * saturation;
              data[i + 1] = gray + (data[i + 1] - gray) * saturation;
              data[i + 2] = gray + (data[i + 2] - gray) * saturation;
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          break;
        }
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      // Upload the edited image
      const fileName = `${image.id}-edited-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // Update the image record
      const { error: updateError } = await supabase
        .from('images')
        .update({
          url: publicUrl,
          width: canvas.width,
          height: canvas.height,
          updated_at: new Date().toISOString(),
        })
        .eq('id', image.id);

      if (updateError) throw updateError;

      // Update editor state
      setEditorState((prev) => ({
        currentEdit: edit,
        history: [...prev.history, edit],
        isProcessing: false,
        error: null,
      }));

      return {
        ...image,
        url: publicUrl,
        width: canvas.width,
        height: canvas.height,
      };
    } catch (error) {
      setEditorState((prev) => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to apply edit',
      }));
      throw error;
    }
  }, [supabase]);

  const undoEdit = useCallback(async (image: AlbumImage) => {
    if (editorState.history.length === 0) return;

    setEditorState((prev) => ({
      ...prev,
      isProcessing: true,
      error: null,
    }));

    try {
      // Remove the last edit from history
      const newHistory = [...editorState.history];
      newHistory.pop();

      // Revert to the original image
      const { error: updateError } = await supabase
        .from('images')
        .update({
          url: (image as any).url || '',
          width: (image as any).width || 0,
          height: (image as any).height || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', image.id);

      if (updateError) throw updateError;

      setEditorState((prev) => ({
        currentEdit: newHistory[newHistory.length - 1] || null,
        history: newHistory,
        isProcessing: false,
        error: null,
      }));
    } catch (error) {
      setEditorState((prev) => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to undo edit',
      }));
      throw error;
    }
  }, [editorState.history, supabase]);

  const resetEdits = useCallback(() => {
    setEditorState({
      currentEdit: null,
      history: [],
      isProcessing: false,
      error: null,
    });
  }, []);

  return {
    editorState,
    applyEdit,
    undoEdit,
    resetEdits,
  };
} 