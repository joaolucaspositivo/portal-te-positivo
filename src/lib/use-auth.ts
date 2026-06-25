import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, refreshSession, signOut } from "@/lib/auth.functions";
import { setAccessToken } from "@/lib/auth-attacher.local";

const REFRESH_TOKEN_KEY = "portal-te.refreshToken";

export type Role = "admin" | "equipe_te" | "editor" | "usuario";
export type ProfileStatus = "pendente" | "ativo" | "bloqueado";

export type LocalUser = {
  id: string;
  email: string;
};

export type LocalProfile = {
  id: string;
  nome_completo: string | null;
  cargo: string | null;
  unidade: string | null;
  telefone: string | null;
  avatar_url: string | null;
  bio: string | null;
  status: ProfileStatus;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

type CurrentUserResponse = {
  id: string;
  email: string;
  roles: Role[];
  profile: any | null;
};

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;

  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function setLocalAuthTokens(tokens: {
  accessToken: string | null;
  refreshToken: string | null;
}): void {
  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);
}

export function clearLocalAuthTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}

function normalizeProfile(profile: any | null): LocalProfile | null {
  if (!profile) return null;

  return {
    id: profile.id,
    nome_completo: profile.nome_completo ?? profile.nomeCompleto ?? null,
    cargo: profile.cargo ?? null,
    unidade: profile.unidade ?? null,
    telefone: profile.telefone ?? null,
    avatar_url: profile.avatar_url ?? profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    status: profile.status ?? "pendente",
    created_at: profile.created_at ?? profile.createdAt ?? null,
    updated_at: profile.updated_at ?? profile.updatedAt ?? null,
  };
}

function normalizeUser(data: CurrentUserResponse | null) {
  if (!data) {
    return {
      user: null,
      roles: [] as Role[],
      profile: null as LocalProfile | null,
    };
  }

  return {
    user: {
      id: data.id,
      email: data.email,
    },
    roles: data.roles ?? [],
    profile: normalizeProfile(data.profile),
  };
}

export function useAuth() {
  const getCurrentUserFn = useServerFn(getCurrentUser);
  const refreshSessionFn = useServerFn(refreshSession);
  const signOutFn = useServerFn(signOut);

  const [user, setUser] = useState<LocalUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuthState = useCallback((data: CurrentUserResponse | null) => {
    const normalized = normalizeUser(data);

    setUser(normalized.user);
    setRoles(normalized.roles);
    setProfile(normalized.profile);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      let current = (await getCurrentUserFn()) as CurrentUserResponse | null;

      if (!current) {
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          try {
            const refreshed = await refreshSessionFn({
              data: {
                refreshToken,
              },
            });

            setLocalAuthTokens({
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
            });

            current = (await getCurrentUserFn()) as CurrentUserResponse | null;
          } catch {
            clearLocalAuthTokens();
            current = null;
          }
        }
      }

      applyAuthState(current);
    } finally {
      setLoading(false);
    }
  }, [applyAuthState, getCurrentUserFn, refreshSessionFn]);

  async function logout() {
    const refreshToken = getRefreshToken();

    try {
      await signOutFn({
        data: {
          refreshToken: refreshToken ?? undefined,
        },
      });
    } finally {
      clearLocalAuthTokens();
      applyAuthState(null);
    }
  }

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isAdmin = roles.includes("admin");
  const isEquipeTE = roles.includes("equipe_te") || isAdmin;
  const isEditor = roles.includes("editor") || isAdmin;
  const status: ProfileStatus | null = profile?.status ?? null;

  return {
    user,
    roles,
    profile,
    status,
    isAdmin,
    isEquipeTE,
    isEditor,
    loading,
    refresh,
    logout,
  };
}