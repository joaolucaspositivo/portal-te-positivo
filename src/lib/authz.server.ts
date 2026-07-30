// Helpers de autorização server-side (substituem RLS do Supabase).
import type { AppRole } from "@prisma/client";

export type AuthCtx = { userId: string; email: string; roles: AppRole[] };

export function hasRole(ctx: { roles: AppRole[] | string[] }, ...roles: AppRole[]) {
  return (ctx.roles as string[]).some((r) => roles.includes(r as AppRole));
}

export function assertAdmin(ctx: { roles: AppRole[] | string[] }) {
  if (!hasRole(ctx, "admin")) throw new Error("Forbidden: apenas administradores.");
}

/** Equipe TE (ou admin) — gestão de solicitações. */
export function assertEquipe(ctx: { roles: AppRole[] | string[] }) {
  if (!hasRole(ctx, "admin", "equipe_te")) throw new Error("Forbidden: apenas equipe TE.");
}

/** Editor de conteúdo (ou admin/equipe TE). */
export function assertEditor(ctx: { roles: AppRole[] | string[] }) {
  if (!hasRole(ctx, "admin", "equipe_te", "editor")) {
    throw new Error("Forbidden: apenas editores.");
  }
}

/** Lê o usuário do header Authorization sem exigir login. Retorna null se anônimo. */
export async function optionalUser(): Promise<AuthCtx | null> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const header = getRequestHeader("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const { verifyAccessToken } = await import("./auth.server");
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    return { userId: payload.sub, email: payload.email, roles: payload.roles as AppRole[] };
  } catch {
    return null;
  }
}