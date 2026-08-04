// functionMiddleware cliente: anexa o access token JWT a toda chamada de server fn.
// Guarda access token em memória (não em localStorage — o refresh é que persiste).
import { createMiddleware } from "@tanstack/react-start";

let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((l) => l());
}

export function subscribeAccessToken(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const attachLocalAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = getAccessToken();
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});