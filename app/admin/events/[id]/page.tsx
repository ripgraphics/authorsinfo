import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { CheckCircleIcon, XCircleIcon, EyeIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import AdminEventStatusActions from './status-actions';
import { ModerateCommentButton, ModerateChatButton } from './moderation-buttons';

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient();
  const { data: event, error } = await supabase
    .from('events')
    .select(`*, category:event_categories(*), created_by, status`)
    .eq('id', id)
    .single();

  if (!event) {
    notFound();
  }

  // Fetch analytics
  const { data: analytics } = await supabase
    .from('event_analytics')
    .select('*')
    .eq('event_id', event.id)
    .order('date', { ascending: false })
    .limit(30);

  // Fetch comments for moderation
  const { data: comments } = await supabase
    .from('event_comments')
    .select('id, user_id, content, created_at, is_hidden')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  // Fetch chat messages for moderation
  const { data: chatMessages } = await supabase
    .from('event_chat_messages')
    .select('id, user_id, message, created_at, is_hidden')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  // Fetch approval log
  const { data: approvalLog } = await supabase
    .from('event_approvals')
    .select('id, approval_status, review_notes, reviewer_id, reviewed_at')
    .eq('event_id', event.id)
    .order('reviewed_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <EyeIcon className="h-6 w-6 text-blue-600" />
          Admin: {event.title}
        </h1>
        <Link href="/admin/events" className="text-blue-600 hover:underline">Back to Events</Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-gray-500">Status:</span>
          {event.status === 'published' && <span className="inline-flex items-center text-green-700"><CheckCircleIcon className="h-4 w-4 mr-1" /> Published</span>}
          {event.status === 'draft' && <span className="inline-flex items-center text-gray-700"><EyeIcon className="h-4 w-4 mr-1" /> Draft</span>}
          {event.status === 'cancelled' && <span className="inline-flex items-center text-red-700"><XCircleIcon className="h-4 w-4 mr-1" /> Cancelled</span>}
          {event.status === 'postponed' && <span className="inline-flex items-center text-yellow-700"><EyeIcon className="h-4 w-4 mr-1" /> Postponed</span>}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Created By:</span> {event.created_by}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Start Date:</span> {event.start_date ? new Date(event.start_date).toLocaleString() : ''}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Category:</span> {event.category?.name}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Description:</span>
          <div className="text-gray-700 mt-1">{event.description || <em>No description</em>}</div>
        </div>
        <div className="flex gap-4 mt-6">
          <AdminEventStatusActions eventId={event.id} currentStatus={event.status} />
        </div>
        {/* Approval Log */}
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">Approval Log</h3>
          {approvalLog && approvalLog.length > 0 ? (
            <table className="min-w-full text-xs border">
              <thead>
                <tr>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">Reviewer</th>
                  <th className="px-2 py-1 border">Note</th>
                  <th className="px-2 py-1 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {approvalLog.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-2 py-1 border">{log.approval_status}</td>
                    <td className="px-2 py-1 border">{log.reviewer_id || '-'}</td>
                    <td className="px-2 py-1 border">{log.review_notes || '-'}</td>
                    <td className="px-2 py-1 border">{log.reviewed_at ? new Date(log.reviewed_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-500">No approval actions yet.</div>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Event Analytics</h2>
        </div>
        {analytics && analytics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">Date</th>
                  <th className="px-2 py-1">Views</th>
                  <th className="px-2 py-1">Registrations</th>
                  <th className="px-2 py-1">Cancellations</th>
                  <th className="px-2 py-1">Likes</th>
                  <th className="px-2 py-1">Comments</th>
                  <th className="px-2 py-1">Shares</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((row: any) => (
                  <tr key={row.date}>
                    <td className="px-2 py-1">{row.date}</td>
                    <td className="px-2 py-1">{row.views}</td>
                    <td className="px-2 py-1">{row.registrations}</td>
                    <td className="px-2 py-1">{row.cancellations}</td>
                    <td className="px-2 py-1">{row.likes}</td>
                    <td className="px-2 py-1">{row.comments}</td>
                    <td className="px-2 py-1">{row.shares}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500">No analytics data available.</div>
        )}
      </div>

      {/* Moderation Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Moderate Comments & Content</h2>
        {comments && comments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {comments.map((comment: any) => (
              <li key={comment.id} className="py-3 flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-800 mb-1">{comment.content}</div>
                  <div className="text-xs text-gray-500">User: {comment.user_id} • {new Date(comment.created_at).toLocaleString()}</div>
                  {comment.is_hidden && <span className="text-xs text-red-600">[Hidden]</span>}
                </div>
                <ModerateCommentButton commentId={comment.id} isHidden={comment.is_hidden} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">No comments for this event.</div>
        )}
      </div>

      {/* Chat Moderation Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Moderate Chat Messages</h2>
        {chatMessages && chatMessages.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {chatMessages.map((msg: any) => (
              <li key={msg.id} className="py-3 flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-800 mb-1">{msg.message}</div>
                  <div className="text-xs text-gray-500">User: {msg.user_id} • {new Date(msg.created_at).toLocaleString()}</div>
                  {msg.is_hidden && <span className="text-xs text-red-600">[Hidden]</span>}
                </div>
                <ModerateChatButton messageId={msg.id} isHidden={msg.is_hidden} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">No chat messages for this event.</div>
        )}
      </div>
    </div>
  );
}
