// functionMiddleware cliente: anexa o access token JWT a toda chamada de server fn.
// Anexa autenticação local às server functions.
import { createMiddleware } from "@tanstack/react-start";

const ACCESS_TOKEN_KEY = "portal-te.accessToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export const attachLocalAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = getAccessToken();
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});