import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["app_role"];
type ProfileStatus = Database["public"]["Enums"]["profile_status"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadFor(u: User | null) {
      if (!u) {
        if (mounted) {
          setRoles([]);
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      const [{ data: rolesData }, { data: profData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.id),
        supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
      ]);
      if (mounted) {
        setRoles((rolesData ?? []).map((r) => r.role));
        setProfile(profData ?? null);
        setLoading(false);
      }
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      loadFor(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
      loadFor(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = roles.includes("admin");
  const isEquipeTE = roles.includes("equipe_te") || isAdmin;
  const isEditor = roles.includes("editor") || isAdmin;
  const status: ProfileStatus | null = profile?.status ?? null;
  return { user, roles, profile, status, isAdmin, isEquipeTE, isEditor, loading, refresh: () => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (!u) { setRoles([]); setProfile(null); return; }
      Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.id),
        supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
      ]).then(([{ data: rd }, { data: pd }]) => {
        setRoles((rd ?? []).map((r) => r.role));
        setProfile(pd ?? null);
      });
    });
  } };
}