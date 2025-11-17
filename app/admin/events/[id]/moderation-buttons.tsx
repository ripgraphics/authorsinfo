"use client"

import { useTransition } from 'react';

export function ModerateCommentButton({ commentId, isHidden }: { commentId: string, isHidden: boolean }) {
  const [isPending, startTransition] = useTransition();
  async function handleModerate() {
    startTransition(async () => {
      await fetch(`/api/admin/comments/${commentId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: !isHidden })
      });
      window.location.reload();
    });
  }
  return (
    <button
      onClick={handleModerate}
      disabled={isPending}
      className={`text-xs px-2 py-1 rounded ${isHidden ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} ml-4`}
    >
      {isHidden ? 'Unhide' : 'Hide'}
    </button>
  );
}

export function ModerateChatButton({ messageId, isHidden }: { messageId: string, isHidden: boolean }) {
  const [isPending, startTransition] = useTransition();
  async function handleModerate() {
    startTransition(async () => {
      await fetch(`/api/admin/chat-messages/${messageId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: !isHidden })
      });
      window.location.reload();
    });
  }
  return (
    <button
      onClick={handleModerate}
      disabled={isPending}
      className={`text-xs px-2 py-1 rounded ${isHidden ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} ml-4`}
    >
      {isHidden ? 'Unhide' : 'Hide'}
    </button>
  );
}

