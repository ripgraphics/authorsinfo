"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useGroupUser } from "./useGroupUser";

export default function GroupPollForm({ groupId, onCreated }: { groupId: string; onCreated: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([""]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [resultsVisibleToRoles, setResultsVisibleToRoles] = useState<string[]>([]);
  const [groupRoles, setGroupRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const { user, groupRole, loading: userLoading, error: userError } = useGroupUser(groupId);

  const canCreate = user && (groupRole === "admin" || groupRole === "moderator");

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
        setResultsVisibleToRoles(roles);
      }
    }
    fetchRoles();
  }, [groupId, supabase]);

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((o, i) => (i === idx ? value : o)));
  };
  const addOption = () => setOptions((opts) => [...opts, ""]);
  const removeOption = (idx: number) => setOptions((opts) => opts.filter((_, i) => i !== idx));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const filteredOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question.trim() || filteredOptions.length < 2) {
      setError("Question and at least 2 options required.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("group_polls").insert([
      {
        group_id: groupId,
        question,
        options: filteredOptions,
        is_anonymous: isAnonymous,
        allow_multiple: allowMultiple,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        created_by: user.id,
        allowed_roles: allowedRoles,
        results_visible_to_roles: resultsVisibleToRoles,
      },
    ]).select().single();
    if (error) setError(error.message);
    else {
      setQuestion("");
      setOptions([""]);
      setIsAnonymous(false);
      setAllowMultiple(false);
      setExpiresAt("");
      setAllowedRoles(groupRoles);
      setResultsVisibleToRoles(groupRoles);
      onCreated();
    }
    setLoading(false);
  };

  if (userLoading) return <div>Loading user...</div>;
  if (!user) return <div className="text-yellow-600">Please log in to create a poll.</div>;
  if (!canCreate)
    return <div className="text-gray-500 italic">You do not have permission to create polls. Only admins or moderators can create polls.</div>;

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 bg-gray-50 animate-fade-in">
      <div className="mb-2">
        <label className="block font-medium">Question</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Options</label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center mb-1">
            <input
              className="border rounded px-2 py-1 flex-1"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
              disabled={loading}
            />
            {options.length > 2 && (
              <button type="button" className="ml-2 text-red-500" onClick={() => removeOption(idx)} disabled={loading}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="text-blue-600 mt-1" onClick={addOption} disabled={loading}>
          + Add Option
        </button>
      </div>
      <div className="mb-2 flex gap-4">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={isAnonymous} onChange={() => setIsAnonymous((v) => !v)} disabled={loading} /> Anonymous
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={allowMultiple} onChange={() => setAllowMultiple((v) => !v)} disabled={loading} /> Allow Multiple
        </label>
      </div>
      <div className="mb-2">
        <label className="block font-medium">Expires At (optional)</label>
        <input
          type="datetime-local"
          className="border rounded px-2 py-1"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Who can vote?</label>
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
      <div className="mb-2">
        <label className="block font-medium">Who can see results?</label>
        <select
          multiple
          className="border rounded px-2 py-1 w-full"
          value={resultsVisibleToRoles}
          onChange={e => setResultsVisibleToRoles(Array.from(e.target.selectedOptions, o => o.value))}
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
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Poll"}
      </button>
    </form>
  );
} 