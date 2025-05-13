"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import UserCard from "./UserCard";
import { useToast } from "../ui/ToastContext";

export default function GroupReadingChallengeLeaderboard({ challenge, groupId }: { challenge: any; groupId: string }) {
  const [progressList, setProgressList] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  // TODO: Replace with real user id
  const userId = "TODO_USER_ID";
  const supabase = createClient();
  const { showToast } = useToast();
  const [prevTopUser, setPrevTopUser] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      // Fetch all progress for this challenge
      const { data, error } = await supabase
        .from("group_reading_challenge_progress")
        .select("*")
        .eq("challenge_id", challenge.id);
      if (data) {
        // Sort by books_read desc, then by updated_at
        const sorted = [...data].sort((a, b) => {
          if (b.books_read !== a.books_read) return b.books_read - a.books_read;
          return new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
        });
        setProgressList(sorted);
        // Fetch user profiles in batch
        const userIds = sorted.map((p) => p.user_id);
        if (userIds.length) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds);
          if (profileData) {
            const map: Record<string, any> = {};
            profileData.forEach((p: any) => { map[p.user_id] = p; });
            setProfiles(map);
          }
        }
        // Notification logic
        if (sorted.length) {
          const topUser = sorted[0].user_id;
          if (prevTopUser && topUser !== prevTopUser && topUser === userId) {
            showToast("You just took the lead in this challenge!", "success");
          }
          setPrevTopUser(topUser);
          // Completion notification
          const currentUser = sorted.find((p) => p.user_id === userId);
          if (currentUser && currentUser.books_read >= challenge.target_books && (!progressList.find((p) => p.user_id === userId) || progressList.find((p) => p.user_id === userId).books_read < challenge.target_books)) {
            showToast("Congratulations! You completed the challenge!", "success");
          }
        }
      }
      setLoading(false);
    }
    fetchLeaderboard();
    // eslint-disable-next-line
  }, [challenge.id, supabase]);

  if (loading) return <div>Loading leaderboard...</div>;
  if (!progressList.length) return <div className="text-gray-500">No participants yet.</div>;

  // Analytics
  const totalParticipants = progressList.length;
  const totalBooks = challenge.target_books * totalParticipants;
  const totalRead = progressList.reduce((sum, p) => sum + (p.books_read || 0), 0);
  const avgProgress = totalParticipants ? Math.round((totalRead / totalBooks) * 100) : 0;
  const completedCount = progressList.filter(p => (p.books_read || 0) >= challenge.target_books).length;
  const completionRate = totalParticipants ? Math.round((completedCount / totalParticipants) * 100) : 0;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-4 mb-2 text-xs text-gray-700">
        <div><span className="font-semibold">Participants:</span> {totalParticipants}</div>
        <div><span className="font-semibold">Avg. Progress:</span> {avgProgress}%</div>
        <div><span className="font-semibold">Completion Rate:</span> {completionRate}%</div>
      </div>
      <div className="font-medium mb-1">Leaderboard</div>
      <div className="space-y-2">
        {progressList.map((p, idx) => {
          const percent = Math.min(100, Math.round((p.books_read / challenge.target_books) * 100));
          const isCurrentUser = p.user_id === userId;
          return (
            <div
              key={p.user_id}
              className={`flex items-center gap-3 p-2 rounded ${isCurrentUser ? "bg-blue-50 border border-blue-300" : "bg-gray-100"}`}
            >
              <div className="w-8 h-8">
                <UserCard user={profiles[p.user_id] || {}}>
                  {profiles[p.user_id]?.avatar_url ? (
                    <img src={profiles[p.user_id].avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-gray-300 inline-block" />
                  )}
                </UserCard>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {profiles[p.user_id]?.display_name || p.user_id}
                  {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                </div>
                <div className="text-xs text-gray-500">{p.books_read} / {challenge.target_books} books ({percent}%)</div>
                <div className="w-full bg-gray-200 rounded h-1 mt-1">
                  <div className="bg-blue-500 h-1 rounded transition-all" style={{ width: percent + "%" }} />
                </div>
              </div>
              <div className="text-lg font-bold w-10 text-right">{p.books_read}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 