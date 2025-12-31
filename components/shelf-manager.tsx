'use client';

/**
 * ShelfManager Component
 * Main component for managing all shelves
 */

import React, { useEffect, useState } from 'react';
import { useShelfStore } from '@/lib/stores/shelf-store';
import { CustomShelf } from '@/types/phase3';
import { ShelfCard } from './shelf-card';
import { ShelfCreationModal } from './shelf-creation-modal';
import { ShelfView } from './shelf-view';
import { ShelfSettings } from './shelf-settings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ShelfManager() {
  const {
    shelves,
    selectedShelfId,
    loading,
    error,
    createShelf,
    fetchShelves,
    selectShelf,
    deleteShelf,
    clearError,
  } = useShelfStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedShelfForSettings, setSelectedShelfForSettings] = useState<CustomShelf | null>(
    null
  );
  const [selectedShelfForDelete, setSelectedShelfForDelete] = useState<CustomShelf | null>(null);

  // Load shelves on mount
  useEffect(() => {
    fetchShelves();
  }, [fetchShelves]);

  // Auto-select first shelf
  useEffect(() => {
    if (shelves.length > 0 && !selectedShelfId) {
      selectShelf(shelves[0].id);
    }
  }, [shelves, selectedShelfId, selectShelf]);

  const selectedShelf = shelves.find((s) => s.id === selectedShelfId);

  const handleCreateShelf = async (input: any) => {
    const result = await createShelf(input);
    if (result) {
      setIsCreateOpen(false);
    }
    return result;
  };

  const handleSettingsClick = (shelf: CustomShelf) => {
    setSelectedShelfForSettings(shelf);
    setIsSettingsOpen(true);
  };

  const handleDeleteClick = (shelf: CustomShelf) => {
    if (shelf.isDefault) {
      alert('Cannot delete default shelves');
      return;
    }
    setSelectedShelfForDelete(shelf);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedShelfForDelete) {
      await deleteShelf(selectedShelfForDelete.id);
      setIsDeleteOpen(false);
      setSelectedShelfForDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Bookshelves</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize and manage your book collections
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          disabled={loading}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Shelf
        </Button>
      </div>

      {/* Tabs View */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Grid View */}
        <TabsContent value="grid" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : shelves.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No shelves yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                Create Your First Shelf
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shelves.map((shelf) => (
                <ShelfCard
                  key={shelf.id}
                  shelf={shelf as any}
                  onSelect={selectShelf}
                  onSettings={handleSettingsClick}
                  onDelete={handleDeleteClick}
                  isSelected={selectedShelfId === shelf.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Details View */}
        <TabsContent value="details" className="space-y-4">
          {selectedShelf ? (
            <ShelfView shelfId={selectedShelf.id} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a shelf to view its contents
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <ShelfCreationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateShelf}
        isLoading={loading}
      />

      {/* Settings Modal */}
      {isSettingsOpen && selectedShelfForSettings && (
        <ShelfSettings
          isOpen={isSettingsOpen}
          shelf={selectedShelfForSettings}
          onClose={() => {
            setIsSettingsOpen(false);
            setSelectedShelfForSettings(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shelf?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the shelf "{selectedShelfForDelete?.name}" but not
              the books in it. Books will remain in your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive">
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
