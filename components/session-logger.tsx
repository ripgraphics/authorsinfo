'use client';

/**
 * SessionLogger Component
 * Log reading sessions with optional timer functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAnalyticsStore } from '@/lib/stores/analytics-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  BookOpen, 
  Play, 
  Pause, 
  Square, 
  Plus,
  Timer,
  FileText,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionLoggerProps {
  bookId?: string;
  bookTitle?: string;
  onSessionCreated?: () => void;
  compact?: boolean;
}

const MOODS = [
  { value: 'focused', label: '🎯 Focused', color: 'bg-blue-100 text-blue-800' },
  { value: 'relaxed', label: '😌 Relaxed', color: 'bg-green-100 text-green-800' },
  { value: 'motivated', label: '🔥 Motivated', color: 'bg-orange-100 text-orange-800' },
  { value: 'distracted', label: '😵 Distracted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'tired', label: '😴 Tired', color: 'bg-gray-100 text-gray-800' },
];

const LOCATIONS = [
  { value: 'home', label: '🏠 Home' },
  { value: 'commute', label: '🚇 Commute' },
  { value: 'library', label: '📚 Library' },
  { value: 'cafe', label: '☕ Café' },
  { value: 'office', label: '💼 Office' },
  { value: 'outdoors', label: '🌳 Outdoors' },
  { value: 'other', label: '📍 Other' },
];

const FORMATS = [
  { value: 'physical', label: '📖 Physical Book' },
  { value: 'ebook', label: '📱 E-Book' },
  { value: 'audiobook', label: '🎧 Audiobook' },
];

export function SessionLogger({
  bookId,
  bookTitle,
  onSessionCreated,
  compact = false,
}: SessionLoggerProps) {
  const { activeTimer, startTimer, stopTimer, resetTimer, createSession } = useAnalyticsStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [displayTime, setDisplayTime] = useState('00:00:00');
  const [formData, setFormData] = useState({
    pagesRead: '',
    startPage: '',
    endPage: '',
    durationMinutes: '',
    mood: '',
    location: '',
    format: 'physical',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update display time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeTimer.isRunning && activeTimer.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - activeTimer.startTime!.getTime()) / 1000
        );
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setDisplayTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [activeTimer.isRunning, activeTimer.startTime]);

  const handleStartTimer = () => {
    startTimer(bookId);
  };

  const handleStopTimer = () => {
    const result = stopTimer();
    if (result) {
      const minutes = Math.round(result.duration / 60);
      setFormData(prev => ({ ...prev, durationMinutes: minutes.toString() }));
      setIsOpen(true);
    }
  };

  const handleResetTimer = () => {
    resetTimer();
    setDisplayTime('00:00:00');
  };

  const handleSubmit = async () => {
    if (!formData.pagesRead) return;

    setIsSubmitting(true);
    try {
      const session = await createSession({
        bookId: bookId as any || undefined,
        pagesRead: parseInt(formData.pagesRead),
        startPage: formData.startPage ? parseInt(formData.startPage) : undefined,
        endPage: formData.endPage ? parseInt(formData.endPage) : undefined,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : undefined,
        sessionMood: (formData.mood as any) || undefined,
        readingLocation: formData.location || undefined,
        readingFormat: formData.format as any,
        notes: formData.notes || undefined,
      });

      if (session) {
        setIsOpen(false);
        setFormData({
          pagesRead: '',
          startPage: '',
          endPage: '',
          durationMinutes: '',
          mood: '',
          location: '',
          format: 'physical',
          notes: '',
        });
        resetTimer();
        setDisplayTime('00:00:00');
        onSessionCreated?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compact timer view
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {activeTimer.isRunning ? (
          <>
            <Badge variant="outline" className="font-mono text-lg px-3 py-1">
              <Timer className="h-4 w-4 mr-2 animate-pulse text-green-500" />
              {displayTime}
            </Badge>
            <Button size="sm" variant="destructive" onClick={handleStopTimer}>
              <Square className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Log Session
              </Button>
            </DialogTrigger>
            <SessionLoggerDialog
              bookId={bookId}
              bookTitle={bookTitle}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onStartTimer={handleStartTimer}
            />
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Reading Session
        </CardTitle>
        <CardDescription>
          {bookTitle ? `Track your reading of "${bookTitle}"` : 'Log your reading progress'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="flex flex-col items-center gap-4 py-4">
          <div className={cn(
            "text-4xl font-mono font-bold",
            activeTimer.isRunning && "text-primary"
          )}>
            {displayTime}
          </div>
          
          <div className="flex gap-2">
            {!activeTimer.isRunning ? (
              <Button onClick={handleStartTimer} className="gap-2">
                <Play className="h-4 w-4" />
                Start Timer
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleResetTimer}>
                  Reset
                </Button>
                <Button variant="destructive" onClick={handleStopTimer} className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop & Log
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Manual Entry Button */}
        <div className="text-center">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Log Manually
              </Button>
            </DialogTrigger>
            <SessionLoggerDialog
              bookId={bookId}
              bookTitle={bookTitle}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onStartTimer={handleStartTimer}
            />
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

// Dialog content component
function SessionLoggerDialog({
  bookId,
  bookTitle,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  onStartTimer,
}: {
  bookId?: string;
  bookTitle?: string;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => void;
  isSubmitting: boolean;
  onStartTimer: () => void;
}) {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Log Reading Session</DialogTitle>
        <DialogDescription>
          {bookTitle 
            ? `Record your progress for "${bookTitle}"`
            : 'Record your reading session details'
          }
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Pages Read */}
        <div className="grid gap-2">
          <Label htmlFor="pagesRead">Pages Read *</Label>
          <Input
            id="pagesRead"
            type="number"
            placeholder="e.g., 25"
            value={formData.pagesRead}
            onChange={(e) => setFormData({ ...formData, pagesRead: e.target.value })}
          />
        </div>

        {/* Page Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="startPage">Start Page</Label>
            <Input
              id="startPage"
              type="number"
              placeholder="e.g., 1"
              value={formData.startPage}
              onChange={(e) => setFormData({ ...formData, startPage: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endPage">End Page</Label>
            <Input
              id="endPage"
              type="number"
              placeholder="e.g., 25"
              value={formData.endPage}
              onChange={(e) => setFormData({ ...formData, endPage: e.target.value })}
            />
          </div>
        </div>

        {/* Duration */}
        <div className="grid gap-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            placeholder="e.g., 30"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
          />
        </div>

        {/* Format */}
        <div className="grid gap-2">
          <Label>Format</Label>
          <Select
            value={formData.format}
            onValueChange={(value) => setFormData({ ...formData, format: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="grid gap-2">
          <Label>Location</Label>
          <Select
            value={formData.location}
            onValueChange={(value) => setFormData({ ...formData, location: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Where did you read?" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mood */}
        <div className="grid gap-2">
          <Label>Mood</Label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <Badge
                key={mood.value}
                variant={formData.mood === mood.value ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-colors',
                  formData.mood === mood.value && mood.color
                )}
                onClick={() => setFormData({ ...formData, mood: mood.value })}
              >
                {mood.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any thoughts or notes about this session..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button onClick={onSubmit} disabled={!formData.pagesRead || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Session'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
