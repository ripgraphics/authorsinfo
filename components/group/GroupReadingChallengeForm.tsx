"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

export default function GroupReadingChallengeForm({ groupId, onCreated }: { groupId: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetBooks, setTargetBooks] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [groupRoles, setGroupRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchRoles() {
      const { data, error } = await supabase
        .from("group_roles")
        .select("name")
        .eq("group_id", groupId);
      if (data) {
        const roles = data.map((r: any) => r.name);
        setGroupRoles(roles);
        setAllowedRoles(roles);
      }
    }
    fetchRoles();
  }, [groupId, supabase]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!title.trim() || !targetBooks) {
      setError("Title and target books are required.");
      setLoading(false);
      return;
    }
    // TODO: Replace with real user id
    const created_by = "TODO_USER_ID";
    const { data, error } = await supabase.from("group_reading_challenges").insert([
      {
        group_id: groupId,
        title,
        description,
        target_books: targetBooks,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        allowed_roles: allowedRoles,
        created_by,
      },
    ]).select().single();
    if (error) setError(error.message);
    else {
      setTitle("");
      setDescription("");
      setTargetBooks(10);
      setStartDate("");
      setEndDate("");
      setAllowedRoles(groupRoles);
      onCreated();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 bg-gray-50">
      <div className="mb-2">
        <label className="block font-medium">Title</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Description</label>
        <textarea
          className="border rounded px-2 py-1 w-full"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          disabled={loading}
        />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Target Books</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-32"
          value={targetBooks}
          onChange={e => setTargetBooks(Number(e.target.value))}
          min={1}
          required
          disabled={loading}
        />
      </div>
      <div className="mb-2 flex gap-4">
        <div>
          <label className="block font-medium">Start Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-medium">End Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <div className="mb-2">
        <label className="block font-medium">Who can join?</label>
        <select
          multiple
          className="border rounded px-2 py-1 w-full"
          value={allowedRoles}
          onChange={e => setAllowedRoles(Array.from(e.target.selectedOptions, o => o.value))}
          disabled={loading}
        >
          {groupRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Challenge"}
      </button>
    </form>
  );
} 