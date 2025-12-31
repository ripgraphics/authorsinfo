'use client';

/**
 * ShelfCreationModal Component
 * Modal dialog for creating a new shelf
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreateShelfInput, CustomShelf } from '@/types/phase3';
import { Plus, Globe, Lock } from 'lucide-react';

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
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

interface ShelfCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (shelf: CreateShelfInput) => Promise<CustomShelf | null>;
  isLoading?: boolean;
}

export function ShelfCreationModal({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: ShelfCreationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [color, setColor] = useState('#3B82F6');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Shelf name is required');
      return;
    }

    if (name.length > 100) {
      setError('Shelf name must be 100 characters or less');
      return;
    }

    const result = await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: icon || undefined,
      color: color || undefined,
      isPublic,
    });

    if (result) {
      // Reset form
      setName('');
      setDescription('');
      setIcon('📚');
      setColor('#3B82F6');
      setIsPublic(true);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Shelf
          </DialogTitle>
          <DialogDescription>
            Create a custom shelf to organize your books
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="shelf-name">
              Shelf Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shelf-name"
              placeholder="e.g., Summer Reads"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={isLoading}
              className="focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/100 characters
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="shelf-description">Description</Label>
            <Textarea
              id="shelf-description"
              placeholder="Add an optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={isLoading}
              className="resize-none h-20"
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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

          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span className="text-lg">{icon}</span>
              <span className="font-semibold">{name || 'Shelf Name'}</span>
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
              disabled={isLoading}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Shelf'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
