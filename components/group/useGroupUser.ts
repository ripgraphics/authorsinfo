"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export function useGroupUser(groupId: string) {
  const [user, setUser] = useState<any>(null);
  const [groupRole, setGroupRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    async function fetchUserAndRole() {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }
      if (!user) {
        setUser(null);
        setGroupRole(null);
        setLoading(false);
        return;
      }
      setUser(user);
      // Fetch group membership
      const { data: member, error: memberError } = await supabase
        .from("group_members")
        .select("role_id, group_roles(name)")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();
      if (memberError) {
        setGroupRole(null);
      } else {
        setGroupRole(member?.group_roles?.name || null);
      }
      setLoading(false);
    }
    fetchUserAndRole();
    return () => { mounted = false; };
  }, [groupId, supabase]);

  return { user, groupRole, loading, error };
} 