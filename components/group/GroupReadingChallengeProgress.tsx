"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function GroupReadingChallengeProgress({ challenge, groupId }: { challenge: any; groupId: string }) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booksRead, setBooksRead] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // TODO: Replace with real user id
  const userId = "TODO_USER_ID";
  const supabase = createClient();

  // Fetch user progress
  useEffect(() => {
    async function fetchProgress() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("group_reading_challenge_progress")
        .select("*")
        .eq("challenge_id", challenge.id)
        .eq("user_id", userId)
        .single();
      if (data) {
        setProgress(data);
        setBooksRead(data.books_read || 0);
      } else {
        setProgress(null);
        setBooksRead(0);
      }
      setLoading(false);
    }
    fetchProgress();
    // Optionally: subscribe to real-time updates for this user's progress
    // ...
  }, [challenge.id, userId, supabase]);

  const handleJoin = async () => {
    setUpdating(true);
    setError(null);
    const { data, error } = await supabase
      .from("group_reading_challenge_progress")
      .upsert([
        { challenge_id: challenge.id, user_id: userId, group_id: groupId, books_read: 0 },
      ], { onConflict: ["challenge_id", "user_id"] })
      .select()
      .single();
    if (error) setError(error.message);
    else {
      setProgress(data);
      setBooksRead(0);
    }
    setUpdating(false);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setError(null);
    const { data, error } = await supabase
      .from("group_reading_challenge_progress")
      .upsert([
        { challenge_id: challenge.id, user_id: userId, group_id: groupId, books_read: booksRead },
      ], { onConflict: ["challenge_id", "user_id"] })
      .select()
      .single();
    if (error) setError(error.message);
    else setProgress(data);
    setUpdating(false);
  };

  const percent = Math.min(100, Math.round((booksRead / challenge.target_books) * 100));
  const completed = booksRead >= challenge.target_books;

  if (loading) return <div>Loading your progress...</div>;

  return (
    <div className="mb-2 p-2 bg-gray-50 rounded">
      {progress ? (
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1">
              <div className="text-sm font-medium">Your Progress</div>
              <div className="text-lg font-bold">{booksRead} / {challenge.target_books} books</div>
              <div className="w-full bg-gray-200 rounded h-2 mt-1 mb-1">
                <div className="bg-blue-500 h-2 rounded transition-all" style={{ width: percent + "%" }} />
              </div>
              <div className="text-xs text-gray-500">{percent}% complete</div>
              {completed && <div className="text-green-600 font-semibold mt-1">Challenge Complete!</div>}
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="number"
                className="border rounded px-2 py-1 w-20"
                value={booksRead}
                min={0}
                max={challenge.target_books}
                onChange={e => setBooksRead(Number(e.target.value))}
                disabled={updating}
              />
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          onClick={handleJoin}
          disabled={updating}
        >
          {updating ? "Joining..." : "Join Challenge"}
        </button>
      )}
      {error && <div className="text-red-500 mt-1">{error}</div>}
    </div>
  );
} 