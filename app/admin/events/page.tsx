import Link from 'next/link';
import { getPublicEvents } from '@/lib/events';
import { createClient } from '@/lib/supabase-server';
import { CalendarDaysIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { UserHoverCard } from '@/components/user-hover-card';

export default async function AdminEventsPage({ searchParams }: { searchParams?: { status?: string, search?: string, creator?: string, page?: string } }) {
  // Pagination
  const page = parseInt(searchParams?.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch all events, including drafts and pending approval
  const supabase = createClient();
  const status = searchParams?.status || '';
  const search = searchParams?.search || '';
  const creator = searchParams?.creator || '';
  let query = supabase
    .from('events')
    .select(`*, category:event_categories(*), created_by, status`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  if (creator) {
    query = query.eq('created_by', creator);
  }
  const { data: events, error, count: totalCount } = await query;

  // Get unique creators for filter and user info
  const creators = Array.from(new Set((events || []).map((e: any) => e.created_by))).filter(Boolean);
  let userMap: Record<string, { id: string, name: string, email: string, created_at: string }> = {};
  if (creators.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .in('id', creators);
    if (users) {
      userMap = Object.fromEntries(users.map((u: any) => [u.id, u]));
    }
  }

  // Bulk actions and selection state will be handled in a client component
  return <AdminEventsBulkUI events={events || []} creators={creators} status={status} search={search} creator={creator} page={page} limit={limit} totalCount={totalCount || 0} userMap={userMap} />;
}

'use client';
import { useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';

function AdminEventsBulkUI({ events, creators, status, search, creator, page, limit, totalCount, userMap }: any) {
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const totalPages = Math.ceil(totalCount / limit);

  function handleSelectAll(e: any) {
    if (e.target.checked) {
      setSelected(events.map((ev: any) => ev.id));
    } else {
      setSelected([]);
    }
  }
  function handleSelect(id: string, checked: boolean) {
    setSelected((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  }
  function openDialog(action: string) {
    setBulkAction(action);
    setShowDialog(true);
  }
  async function handleBulkAction() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/events/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected, status: bulkAction, reason: note, reviewer_id: null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk action failed');
      setMessage(data.message);
      setShowDialog(false);
      setSelected([]);
      if (formRef.current) formRef.current.submit(); // refresh page
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
          Event Admin Dashboard
        </h1>
        <Link href="/events" className="text-blue-600 hover:underline">View Public Events</Link>
      </div>
      <form ref={formRef} className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select name="status" defaultValue={status} className="border rounded px-2 py-1 text-sm">
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
          <input name="search" defaultValue={search} placeholder="Search title..." className="border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Creator</label>
          <select name="creator" defaultValue={creator} className="border rounded px-2 py-1 text-sm">
            <option value="">All</option>
            {creators.map((c: string) => (
              <option key={c} value={c}>{userMap[c]?.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" className="h-9">Filter</Button>
      </form>
      <div className="mb-2 flex gap-2 items-center">
        <input type="checkbox" id="select-all" className="mr-2" checked={selected.length === events.length && events.length > 0} onChange={handleSelectAll} />
        <label htmlFor="select-all" className="text-xs">Select All</label>
        <Button type="button" size="sm" variant="success" className="ml-2" disabled={selected.length === 0} onClick={() => openDialog('published')}>Bulk Approve</Button>
        <Button type="button" size="sm" variant="destructive" disabled={selected.length === 0} onClick={() => openDialog('cancelled')}>Bulk Cancel</Button>
        <Button type="button" size="sm" variant="outline" disabled={selected.length === 0} onClick={() => openDialog('rejected')}>Bulk Reject</Button>
        {message && <span className="ml-4 text-xs text-green-700">{message}</span>}
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2"><input type="checkbox" checked={selected.length === events.length && events.length > 0} onChange={handleSelectAll} /></th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events && events.length > 0 ? events.map((event: any) => (
              <tr key={event.id} className={selected.includes(event.id) ? 'bg-blue-50' : ''}>
                <td className="px-2 py-2"><input type="checkbox" checked={selected.includes(event.id)} onChange={e => handleSelect(event.id, e.target.checked)} /></td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <Link href={`/admin/events/${event.id}`} className="text-blue-600 hover:underline font-medium">{event.title}</Link>
                  <div className="text-xs text-gray-500">{event.category?.name}</div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {event.status === 'published' && <span className="inline-flex items-center text-green-700"><CheckCircleIcon className="h-4 w-4 mr-1" /> Published</span>}
                  {event.status === 'draft' && <span className="inline-flex items-center text-gray-700"><EyeIcon className="h-4 w-4 mr-1" /> Draft</span>}
                  {event.status === 'cancelled' && <span className="inline-flex items-center text-red-700"><XCircleIcon className="h-4 w-4 mr-1" /> Cancelled</span>}
                  {event.status === 'postponed' && <span className="inline-flex items-center text-yellow-700"><EyeIcon className="h-4 w-4 mr-1" /> Postponed</span>}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {userMap[event.created_by] ? (
                    <UserHoverCard user={userMap[event.created_by]}>
                      {userMap[event.created_by].name}
                    </UserHoverCard>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{event.start_date ? new Date(event.start_date).toLocaleString() : ''}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <Link href={`/admin/events/${event.id}`} className="text-blue-600 hover:underline mr-2">Moderate</Link>
                  <Link href={`/events/${event.slug || event.id}`} className="text-gray-600 hover:underline" target="_blank">View</Link>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No events found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Link key={p} href={`?page=${p}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}${creator ? `&creator=${creator}` : ''}`} className={`px-3 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} hover:bg-blue-700 hover:text-white`}>{p}</Link>
        ))}
      </div>
      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} className="fixed z-50 inset-0 flex items-center justify-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto z-10">
          <Dialog.Title className="text-lg font-semibold mb-2">Confirm Bulk {bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)}</Dialog.Title>
          <p className="mb-2 text-sm">Are you sure you want to set {selected.length} event(s) to <b>{bulkAction}</b>?</p>
          <textarea
            className="w-full border border-gray-300 rounded p-2 text-sm mb-2"
            rows={2}
            placeholder="Add a note (optional) for this action..."
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-2 justify-end mt-2">
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>Cancel</Button>
            <Button type="button" variant={bulkAction === 'published' ? 'success' : bulkAction === 'cancelled' ? 'destructive' : 'outline'} onClick={handleBulkAction} disabled={loading}>{loading ? 'Processing...' : 'Confirm'}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
} 