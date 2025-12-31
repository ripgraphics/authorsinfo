'use client';

/**
 * ShelfCard Component
 * Displays a single shelf with its metadata and book count
 */

import React from 'react';
import { CustomShelf } from '@/types/phase3';
import { cn } from '@/lib/utils';
import { MoreVertical, Trash2, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ShelfCardProps {
  shelf: CustomShelf & { bookCount?: number };
  onSelect: (shelf: CustomShelf) => void;
  onSettings: (shelf: CustomShelf) => void;
  onDelete: (shelf: CustomShelf) => void;
  isSelected?: boolean;
  className?: string;
}

export function ShelfCard({
  shelf,
  onSelect,
  onSettings,
  onDelete,
  isSelected = false,
  className,
}: ShelfCardProps) {
  return (
    <button
      onClick={() => onSelect(shelf)}
      className={cn(
        'group relative w-full p-4 rounded-lg border-2 transition-all',
        'hover:border-primary/50 hover:bg-accent',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {shelf.icon && <span className="text-lg">{shelf.icon}</span>}
            <h3 className="font-semibold text-sm truncate">{shelf.name}</h3>
            {shelf.isDefault && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                Default
              </span>
            )}
          </div>

          {shelf.description && (
            <p className="text-xs text-muted-foreground truncate mb-2">
              {shelf.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            {shelf.color && (
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: shelf.color }}
              />
            )}
            <span className="text-xs text-muted-foreground">
              {shelf.bookCount || 0} {shelf.bookCount === 1 ? 'book' : 'books'}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSettings(shelf);
              }}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            {!shelf.isDefault && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(shelf);
                }}
                className="flex items-center gap-2 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </button>
  );
}
