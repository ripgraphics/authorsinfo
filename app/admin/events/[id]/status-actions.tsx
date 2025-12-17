"use client";
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';

export default function AdminEventStatusActions({ eventId, currentStatus }: { eventId: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function updateStatus(status: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: note, reviewer_id: null })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update status');
      } else {
        setSuccess(data.message);
        window.location.reload();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 items-start w-full max-w-lg">
      <textarea
        className="w-full border border-gray-300 rounded-sm p-2 text-sm mb-2"
        rows={2}
        placeholder="Add a note (optional) for this action..."
        value={note}
        onChange={e => setNote(e.target.value)}
        disabled={isPending}
      />
      <div className="flex gap-2 items-center">
        {currentStatus !== 'published' && (
          <Button variant="default" disabled={isPending} onClick={() => updateStatus('published')}>Approve</Button>
        )}
        {currentStatus !== 'cancelled' && (
          <Button variant="destructive" disabled={isPending} onClick={() => updateStatus('cancelled')}>Cancel</Button>
        )}
        {currentStatus !== 'rejected' && (
          <Button variant="outline" disabled={isPending} onClick={() => updateStatus('rejected')}>Reject</Button>
        )}
        {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
        {success && <span className="text-xs text-green-600 ml-2">{success}</span>}
      </div>
    </div>
  );
} 