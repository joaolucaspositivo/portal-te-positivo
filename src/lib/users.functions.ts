import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";

function assertAdmin(ctx: { roles?: string[] }) {
  if (!ctx.roles?.includes("admin")) {
    throw new Error("Forbidden");
  }
}

function toProfileRow(profile: any | null) {
  if (!profile) return null;

  return {
    id: profile.id,
    nome_completo: profile.nomeCompleto ?? null,
    cargo: profile.cargo ?? null,
    unidade: profile.unidade ?? null,
    telefone: profile.telefone ?? null,
    avatar_url: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    status: profile.status ?? "pendente",
    created_at: profile.createdAt ?? null,
    updated_at: profile.updatedAt ?? null,
  };
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const users = await prisma.user.findMany({
      orderBy: { email: "asc" },
      include: {
        profile: true,
        roles: true,
        unidades: {
          include: {
            unidade: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.createdAt,
      last_sign_in_at: null,
      profile: toProfileRow(u.profile),
      roles: u.roles.map((r) => r.role),
      unidades: u.unidades.map((v) => ({
        id: v.unidade.id,
        nome: v.unidade.nome,
        sigla: v.unidade.sigla,
        status: v.unidade.status,
        principal: v.principal,
      })),
    }));
  });

const StatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["pendente", "ativo", "bloqueado"]),
});

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => StatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.profile.upsert({
      where: { id: data.userId },
      create: {
        id: data.userId,
        status: data.status,
      },
      update: {
        status: data.status,
      },
    });

    return { ok: true };
  });

const RolesSchema = z.object({
  userId: z.string().uuid(),
  roles: z.array(z.enum(["admin", "equipe_te", "editor", "usuario"])).min(1),
});

export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => RolesSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as any;

    assertAdmin(ctx);

    if (data.userId === ctx.userId && !data.roles.includes("admin")) {
      throw new Error("Você não pode remover seu próprio papel de admin.");
    }

    const { prisma } = await import("./db.server");

    const uniqueRoles = Array.from(new Set(data.roles));

    await prisma.$transaction([
      prisma.userRole.deleteMany({
        where: {
          userId: data.userId,
        },
      }),
      prisma.userRole.createMany({
        data: uniqueRoles.map((role) => ({
          userId: data.userId,
          role,
        })),
      }),
    ]);

    return { ok: true };
  });

const ProfileSchema = z.object({
  userId: z.string().uuid(),
  nome_completo: z.string().trim().max(160).optional().nullable(),
  cargo: z.string().trim().max(160).optional().nullable(),
  unidade: z.string().trim().max(160).optional().nullable(),
  telefone: z.string().trim().max(40).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
});

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => ProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.profile.upsert({
      where: { id: data.userId },
      create: {
        id: data.userId,
        nomeCompleto: data.nome_completo ?? null,
        cargo: data.cargo ?? null,
        unidade: data.unidade ?? null,
        telefone: data.telefone ?? null,
        bio: data.bio ?? null,
      },
      update: {
        nomeCompleto: data.nome_completo ?? null,
        cargo: data.cargo ?? null,
        unidade: data.unidade ?? null,
        telefone: data.telefone ?? null,
        bio: data.bio ?? null,
      },
    });

    return { ok: true };
  });

const ResetSchema = z.object({
  email: z.string().email(),
});

export const sendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => ResetSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { createPasswordResetForEmail } = await import("./password-reset.server");

    await createPasswordResetForEmail(data.email);

    return { ok: true };
  });

const DeleteSchema = z.object({
  userId: z.string().uuid(),
});

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => DeleteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as any;

    assertAdmin(ctx);

    if (data.userId === ctx.userId) {
      throw new Error("Você não pode excluir a si mesmo.");
    }

    const { prisma } = await import("./db.server");

    await prisma.user.delete({
      where: {
        id: data.userId,
      },
    });

    return { ok: true };
  });