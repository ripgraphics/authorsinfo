"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import GroupPollForm from "./GroupPollForm";
import GroupPollResults from "./GroupPollResults";
import { useGroupUser } from "./useGroupUser";
import Modal from "../ui/Modal";

export default function GroupPolls({ groupId }: { groupId: string }) {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any | null>(null);
  const supabase = createClient();
  const { user, groupRole, loading: userLoading } = useGroupUser(groupId);

  // Fetch polls
  const fetchPolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("group_polls")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setPolls(data || []);
    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    fetchPolls();
    // Real-time subscription for polls
    const pollSub = supabase
      .channel("group_polls")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_polls", filter: `group_id=eq.${groupId}` },
        () => fetchPolls()
      )
      .subscribe();
    // Real-time subscription for votes
    const voteSub = supabase
      .channel("group_poll_votes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_poll_votes", filter: `group_id=eq.${groupId}` },
        () => fetchPolls()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(pollSub);
      supabase.removeChannel(voteSub);
    };
  }, [groupId, fetchPolls, supabase]);

  if (loading || userLoading) return <div>Loading polls...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        {user && (groupRole === "admin" || groupRole === "moderator") ? (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:scale-95 transition"
            onClick={() => setShowForm(true)}
          >
            Create Poll
          </button>
        ) : user ? (
          <span className="text-gray-400 italic">Only admins or moderators can create polls.</span>
        ) : (
          <span className="text-yellow-600">Please log in to create a poll.</span>
        )}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Poll">
        <GroupPollForm groupId={groupId} onCreated={() => { setShowForm(false); fetchPolls(); }} />
      </Modal>
      <div>
        {polls.length === 0 && <div className="text-gray-500">No polls yet.</div>}
        {polls.map((poll) => (
          <div key={poll.id} className="border rounded p-4 mb-4 bg-white shadow">
            <div className="font-semibold text-lg mb-2">{poll.question}</div>
            <GroupPollResults poll={poll} groupId={groupId} />
          </div>
        ))}
      </div>
    </div>
  );
} 