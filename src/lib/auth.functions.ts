// Server functions de autenticação (substituem supabase.auth.*).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SignUpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(200),
  nome: z.string().trim().min(2).max(160),
});

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SignUpSchema.parse(data))
  .handler(async ({ data }) => {
    const { prisma } = await import("./db.server");
    const { hashPassword, signAccessToken, issueRefreshToken } = await import("./auth.server");

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("E-mail já cadastrado.");

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        profile: { create: { nomeCompleto: data.nome, status: "pendente" } },
        roles: { create: { role: "usuario" } },
      },
      include: { roles: true },
    });

    // Promove o primeiro admin (substitui o trigger handle_new_user)
    if (data.email === "tecipp@colegiopositivo.com.br") {
      await prisma.userRole.upsert({
        where: { userId_role: { userId: user.id, role: "admin" } },
        create: { userId: user.id, role: "admin" },
        update: {},
      });
      await prisma.profile.update({ where: { id: user.id }, data: { status: "ativo" } });
    }

    const roles = user.roles.map((r) => r.role);
    const accessToken = signAccessToken({ sub: user.id, email: user.email, roles });
    const refreshToken = await issueRefreshToken(user.id);
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, roles } };
  });

const SignInSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SignInSchema.parse(data))
  .handler(async ({ data }) => {
    const { prisma } = await import("./db.server");
    const { verifyPassword, signAccessToken, issueRefreshToken } = await import("./auth.server");

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { roles: true },
    });
    if (!user || !user.passwordHash) throw new Error("E-mail ou senha inválidos.");
    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) throw new Error("E-mail ou senha inválidos.");

    const roles = user.roles.map((r) => r.role);
    const accessToken = signAccessToken({ sub: user.id, email: user.email, roles });
    const refreshToken = await issueRefreshToken(user.id);
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, roles } };
  });

const RefreshSchema = z.object({ refreshToken: z.string().min(1) });

export const refreshSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RefreshSchema.parse(data))
  .handler(async ({ data }) => {
    const { prisma } = await import("./db.server");
    const { rotateRefreshToken, signAccessToken } = await import("./auth.server");

    const rotated = await rotateRefreshToken(data.refreshToken);
    if (!rotated) throw new Error("Sessão expirada. Faça login novamente.");

    const user = await prisma.user.findUnique({
      where: { id: rotated.userId },
      include: { roles: true },
    });
    if (!user) throw new Error("Usuário não encontrado.");

    const roles = user.roles.map((r) => r.role);
    const accessToken = signAccessToken({ sub: user.id, email: user.email, roles });
    return {
      accessToken,
      refreshToken: rotated.newToken,
      user: { id: user.id, email: user.email, roles },
    };
  });

export const signOut = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ refreshToken: z.string().optional() }).parse(data))
  .handler(async ({ data }) => {
    if (data.refreshToken) {
      const { revokeRefreshToken } = await import("./auth.server");
      await revokeRefreshToken(data.refreshToken);
    }
    return { ok: true };
  });

export const getCurrentUser = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const authHeader = getRequestHeader("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice("Bearer ".length);
    try {
      const { verifyAccessToken, loadUserWithRoles } = await import("./auth.server");
      const payload = verifyAccessToken(token);
      const user = await loadUserWithRoles(payload.sub);
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        roles: user.roles.map((r) => r.role),
        profile: user.profile,
      };
    } catch {
      return null;
    }
  });