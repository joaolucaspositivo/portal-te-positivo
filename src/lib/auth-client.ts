// Cliente-side: gerencia access token (memória) + refresh token (localStorage),
// e expõe helpers signIn/signUp/signOut/refresh/getCurrentUser.
import { signIn as signInFn, signUp as signUpFn, signOut as signOutFn, refreshSession as refreshFn, getCurrentUser as meFn } from "./auth.functions";
import { setAccessToken as setAccessTokenAttacher } from "./auth-attacher.local";

const REFRESH_KEY = "portal-te.refreshToken";

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

function setRefreshToken(v: string | null) {
  if (typeof window === "undefined") return;
  if (v) window.localStorage.setItem(REFRESH_KEY, v);
  else window.localStorage.removeItem(REFRESH_KEY);
}

function storeSession(res: { accessToken: string; refreshToken: string }) {
  setAccessTokenAttacher(res.accessToken);
  setRefreshToken(res.refreshToken);
}

export async function signIn(email: string, password: string) {
  const res = await signInFn({ data: { email, password } });
  storeSession(res);
  return res.user;
}

export async function signUp(email: string, password: string, nome: string) {
  const res = await signUpFn({ data: { email, password, nome } });
  storeSession(res);
  return res.user;
}

export async function signOut() {
  const refreshToken = getRefreshToken() ?? undefined;
  try {
    await signOutFn({ data: { refreshToken } });
  } catch {
    /* ignorar */
  }
  setAccessTokenAttacher(null);
  setRefreshToken(null);
}

/** Tenta renovar; retorna true se conseguiu. */
export async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await refreshFn({ data: { refreshToken: rt } });
    storeSession(res);
    return true;
  } catch {
    setAccessTokenAttacher(null);
    setRefreshToken(null);
    return false;
  }
}

export async function fetchCurrentUser() {
  return meFn();
}