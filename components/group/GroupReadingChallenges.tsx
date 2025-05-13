"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import GroupReadingChallengeForm from "./GroupReadingChallengeForm";
import GroupReadingChallengeProgress from "./GroupReadingChallengeProgress";
import GroupReadingChallengeLeaderboard from "./GroupReadingChallengeLeaderboard";

export default function GroupReadingChallenges({ groupId }: { groupId: string }) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("group_reading_challenges")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setChallenges(data || []);
    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    fetchChallenges();
    // Real-time subscription for challenges
    const challengeSub = supabase
      .channel("group_reading_challenges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_reading_challenges", filter: `group_id=eq.${groupId}` },
        () => fetchChallenges()
      )
      .subscribe();
    // Real-time subscription for progress
    const progressSub = supabase
      .channel("group_reading_challenge_progress")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_reading_challenge_progress", filter: `group_id=eq.${groupId}` },
        () => fetchChallenges()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(challengeSub);
      supabase.removeChannel(progressSub);
    };
  }, [groupId, fetchChallenges, supabase]);

  if (loading) return <div>Loading challenges...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Create Challenge"}
        </button>
      </div>
      {showForm && (
        <GroupReadingChallengeForm groupId={groupId} onCreated={() => { setShowForm(false); fetchChallenges(); }} />
      )}
      <div>
        {challenges.length === 0 && <div>No challenges yet.</div>}
        {challenges.map((challenge) => (
          <div key={challenge.id} className="border rounded p-4 mb-4 bg-white shadow">
            <div className="font-semibold text-lg mb-2">{challenge.title}</div>
            <div className="mb-2 text-sm text-gray-600">{challenge.description}</div>
            <GroupReadingChallengeProgress challenge={challenge} groupId={groupId} />
            <GroupReadingChallengeLeaderboard challenge={challenge} groupId={groupId} />
          </div>
        ))}
      </div>
    </div>
  );
} 