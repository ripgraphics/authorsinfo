'use client';

/**
 * ShelfSettings Component
 * Modal for editing shelf metadata
 */

import React, { useState } from 'react';
import { CustomShelf, UpdateShelfInput } from '@/types/phase3';
import { useShelfStore } from '@/lib/stores/shelf-store';
import { ReusableModal } from '@/components/ui/reusable-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Globe, Lock } from 'lucide-react';

const SHELF_ICONS = [
  '📚',
  '⭐',
  '❤️',
  '🎯',
  '🔥',
  '🌟',
  '📖',
  '✨',
  '🎨',
  '💡',
];

const SHELF_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#6366F1',
];

interface ShelfSettingsProps {
  isOpen: boolean;
  shelf: CustomShelf;
  onClose: () => void;
}

export function ShelfSettings({ isOpen, shelf, onClose }: ShelfSettingsProps) {
  const { updateShelf, loading, error } = useShelfStore();
  const [name, setName] = useState(shelf.name);
  const [description, setDescription] = useState(shelf.description || '');
  const [icon, setIcon] = useState(shelf.icon || '📚');
  const [color, setColor] = useState(shelf.color || '#3B82F6');
  const [isPublic, setIsPublic] = useState(shelf.isPublic ?? true);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!name.trim()) {
      setLocalError('Shelf name is required');
      return;
    }

    if (name.length > 100) {
      setLocalError('Shelf name must be 100 characters or less');
      return;
    }

    const updates: UpdateShelfInput = {};
    if (name !== shelf.name) updates.name = name.trim();
    if (description !== (shelf.description || '')) {
      updates.description = description.trim() || undefined;
    }
    if (icon !== shelf.icon) updates.icon = icon || undefined;
    if (color !== shelf.color) updates.color = color;
    if (isPublic !== shelf.isPublic) updates.isPublic = isPublic;

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    await updateShelf(shelf.id, updates);
    onClose();
  };

  return (
    <ReusableModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Shelf Settings"
      description="Edit your shelf properties"
      contentClassName="sm:max-w-[500px]"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="shelf-settings-form" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
        <form id="shelf-settings-form" onSubmit={handleSubmit} className="space-y-6">
          {(localError || error) && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {localError || error}
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-shelf-name">
              Shelf Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-shelf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{name.length}/100</p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-shelf-desc">Description</Label>
            <Textarea
              id="edit-shelf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={loading}
              className="resize-none h-20"
            />
            <p className="text-xs text-muted-foreground">{description.length}/500</p>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {SHELF_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  disabled={loading}
                  className={`p-3 rounded-lg border-2 transition-all text-2xl ${
                    icon === emoji
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {SHELF_COLORS.map((shelfColor) => (
                <button
                  key={shelfColor}
                  type="button"
                  onClick={() => setColor(shelfColor)}
                  disabled={loading}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    color === shelfColor
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: shelfColor }}
                  title={shelfColor}
                />
              ))}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="w-4 h-4 text-primary" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
                <Label className="text-base">Public Shelf</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPublic
                  ? 'Anyone can see this shelf on your profile'
                  : 'Only you can see this shelf'}
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={loading}
            />
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span className="text-lg">{icon}</span>
              <span className="font-semibold">{name}</span>
            </div>
          </div>
        </form>
    </ReusableModal>
  );
}
