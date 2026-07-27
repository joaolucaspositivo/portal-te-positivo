import { useCallback, useEffect, useState } from "react";
import type { AppRole, ProfileStatus } from "@prisma/client";
import { fetchCurrentUser, tryRefresh } from "./auth-client";
import { subscribeAccessToken, getAccessToken } from "./auth-attacher.local";

/** Perfil serializado (snake_case) — formato consumido pelas telas. */
export type ProfileDTO = {
  id: string;
  nome_completo: string | null;
  cargo: string | null;
  unidade: string | null;
  telefone: string | null;
  avatar_url: string | null;
  bio: string | null;
  status: ProfileStatus;
};

type CurrentUser = {
  id: string;
  email: string;
  roles: AppRole[];
  profile: ProfileDTO | null;
};

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    // Se não temos access token mas temos refresh, tenta renovar.
    if (!getAccessToken()) {
      const ok = await tryRefresh();
      if (!ok) {
        setUser(null);
        setLoading(false);
        return;
      }
    }
    try {
      const me = await fetchCurrentUser();
      setUser(me ? (me as CurrentUser) : null);
    } catch {
      // Token pode ter expirado; tenta refresh e reprova.
      const ok = await tryRefresh();
      if (ok) {
        try {
          const me = await fetchCurrentUser();
          setUser(me ? (me as CurrentUser) : null);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const unsub = subscribeAccessToken(() => {
      void reload();
    });
    return unsub;
  }, [reload]);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const isEquipeTE = roles.includes("equipe_te") || isAdmin;
  const isEditor = roles.includes("editor") || isAdmin;
  const status: ProfileStatus | null = user?.profile?.status ?? null;

  return {
    user,
    roles,
    profile: user?.profile ?? null,
    status,
    isAdmin,
    isEquipeTE,
    isEditor,
    loading,
    refresh: reload,
  };
}