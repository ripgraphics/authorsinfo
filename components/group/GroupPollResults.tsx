"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useGroupUser } from "./useGroupUser";
import Modal from "../ui/Modal";
import UserCard from "./UserCard";

function useUserProfiles(userIds: string[]) {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  useEffect(() => {
    async function fetchProfiles() {
      if (!userIds.length) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, bio, avatar_url")
        .in("user_id", userIds);
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((p: any) => { map[p.user_id] = p; });
        setProfiles(map);
      }
    }
    fetchProfiles();
  }, [userIds]);
  return profiles;
}

export default function GroupPollResults({ poll, groupId }: { poll: any; groupId: string }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const supabase = createClient();
  const { user, groupRole, loading: userLoading } = useGroupUser(groupId);
  const [allVoterIds, setAllVoterIds] = useState<string[]>([]);

  // Fetch poll results
  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/groups/${groupId}/polls/results?poll_id=${poll.id}`);
    if (!res.ok) {
      setError("Failed to load results");
      setLoading(false);
      return;
    }
    const { results } = await res.json();
    setResults(results);
    // Collect all voter ids for profile lookup
    const ids = results.flatMap((r: any) => r.voters || []);
    setAllVoterIds(Array.from(new Set(ids)));
    setLoading(false);
  };

  // Check if user has voted
  const checkVoted = async () => {
    if (!user) return setVoted(false);
    const { data } = await supabase
      .from("group_poll_votes")
      .select("*")
      .eq("poll_id", poll.id)
      .eq("user_id", user.id);
    setVoted((data && data.length > 0) || false);
  };

  useEffect(() => {
    fetchResults();
    checkVoted();
    // Real-time update on vote
    const voteSub = supabase
      .channel("group_poll_votes_results_" + poll.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_poll_votes", filter: `poll_id=eq.${poll.id}` },
        () => {
          fetchResults();
          checkVoted();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(voteSub);
    };
    // eslint-disable-next-line
  }, [poll.id, user]);

  const profiles = useUserProfiles(allVoterIds);

  // Permission checks
  const canVote = user && poll.allowed_roles && poll.allowed_roles.includes(groupRole);
  const canSeeResults = user && poll.results_visible_to_roles && poll.results_visible_to_roles.includes(groupRole);

  const handleVote = async () => {
    setError(null);
    if (selected.length === 0) {
      setError("Select at least one option");
      return;
    }
    for (const option_index of selected) {
      const res = await fetch(`/api/groups/${groupId}/polls/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll_id: poll.id, user_id: user.id, option_index, allow_multiple: poll.allow_multiple }),
      });
      if (!res.ok) {
        setError("Failed to vote");
        return;
      }
    }
    setVoted(true);
    fetchResults();
  };

  if (loading || userLoading) return <div>Loading poll...</div>;
  if (!user) return <div className="text-yellow-600">Please log in to vote in this poll.</div>;
  if (!groupRole) return <div className="text-gray-500 italic">You must be a group member to vote in this poll.</div>;
  if (!canVote && !canSeeResults) return <div className="text-gray-400 italic">You do not have permission to vote or view results for this poll.</div>;

  // Animated bar for results
  function ResultBar({ percent }: { percent: number }) {
    return (
      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
        <div
          className="bg-blue-500 h-3 rounded transition-all duration-700"
          style={{ width: percent + "%" }}
        />
      </div>
    );
  }

  // Modal content for results
  function ResultsModalContent() {
    return (
      <div>
        <div className="mb-2 font-medium">Results:</div>
        {results.map((r: any, idx: number) => {
          const percent = results.reduce((a: number, b: any) => a + b.count, 0)
            ? Math.round((r.count / results.reduce((a: number, b: any) => a + b.count, 0)) * 100)
            : 0;
          return (
            <div key={idx} className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{poll.options[idx]}</span>
                <span className="text-xs text-gray-500">{r.count} vote{r.count !== 1 ? "s" : ""} ({percent}%)</span>
              </div>
              <ResultBar percent={percent} />
              {!poll.is_anonymous && r.voters.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {r.voters.map((v: string) => (
                    <UserCard key={v} user={profiles[v]}>
                      <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-1 cursor-pointer hover:bg-blue-50 transition">
                        {profiles[v]?.avatar_url ? (
                          <img src={profiles[v].avatar_url} alt="avatar" className="w-5 h-5 rounded-full inline-block" />
                        ) : (
                          <span className="w-5 h-5 inline-block rounded-full bg-gray-300" />
                        )}
                        <span className="font-medium">{profiles[v]?.display_name || profiles[v]?.bio || v}</span>
                      </span>
                    </UserCard>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {!voted && !showResults && canVote ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleVote();
          }}
          className="animate-fade-in"
        >
          <div className="mb-2">
            {poll.options.map((opt: string, idx: number) => (
              <label key={idx} className="block mb-1">
                <input
                  type={poll.allow_multiple ? "checkbox" : "radio"}
                  name={`option-${poll.id}`}
                  value={idx}
                  checked={selected.includes(idx)}
                  onChange={e => {
                    if (poll.allow_multiple) {
                      setSelected(sel =>
                        e.target.checked ? [...sel, idx] : sel.filter(i => i !== idx)
                      );
                    } else {
                      setSelected([idx]);
                    }
                  }}
                  disabled={loading}
                />
                <span className="ml-2">{opt}</span>
              </label>
            ))}
          </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <button
            type="submit"
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 active:scale-95 transition disabled:opacity-50"
            disabled={loading}
          >
            Vote
          </button>
          <button
            type="button"
            className="ml-2 text-blue-600 underline"
            onClick={() => setShowResultsModal(true)}
            disabled={loading}
          >
            View Results
          </button>
        </form>
      ) : canSeeResults ? (
        <div className="animate-fade-in">
          <button
            type="button"
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 active:scale-95 transition mb-2"
            onClick={() => setShowResultsModal(true)}
          >
            View Results
          </button>
          <Modal open={showResultsModal} onClose={() => setShowResultsModal(false)} title="Poll Results">
            <ResultsModalContent />
            <button
              type="button"
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:scale-95 transition"
              onClick={() => setShowResultsModal(false)}
            >
              Close
            </button>
          </Modal>
        </div>
      ) : (
        <div className="text-gray-400 italic">You do not have permission to view results for this poll.</div>
      )}
    </div>
  );
} 