// Middleware local para server functions que exigem login.
// Lê Authorization: Bearer <jwt>, valida usuário ativo e injeta { userId, email, roles } no context.
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { AppRole } from "@prisma/client";

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();

  if (!request?.headers) throw new Error("Unauthorized: sem headers");

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: sem token");
  }

  const token = authHeader.slice("Bearer ".length);

  const { verifyAccessToken, loadUserWithRoles } = await import("./auth.server");
  const { assertProfileCanAccess } = await import("./auth-policy.server");

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new Error("Unauthorized: token inválido ou expirado");
  }

  const user = await loadUserWithRoles(payload.sub);

  if (!user) {
    throw new Error("Unauthorized: usuário não encontrado");
  }

  assertProfileCanAccess(user.profile?.status);

  return next({
    context: {
      userId: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role) as AppRole[],
    },
  });
});

/** Use depois de requireAuth pra exigir um papel específico. */
export function requireRole(role: AppRole) {
  return createMiddleware({ type: "function" }).server(async ({ next, context }) => {
    const ctx = context as { roles?: AppRole[] };

    if (!ctx.roles?.includes(role)) {
      throw new Error(`Forbidden: papel "${role}" obrigatório`);
    }

    return next();
  });
}