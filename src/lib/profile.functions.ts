import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";

function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

const UpdateMyProfileSchema = z.object({
  nome_completo: z.string().trim().max(160).optional().nullable(),
  cargo: z.string().trim().max(160).optional().nullable(),
  unidade: z.string().trim().max(160).optional().nullable(),
  telefone: z.string().trim().max(60).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  avatar_url: z.string().trim().max(500).optional().nullable(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => UpdateMyProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const { prisma } = await import("./db.server");

    const profile = await prisma.profile.upsert({
      where: {
        id: ctx.userId,
      },
      create: {
        id: ctx.userId,
        nomeCompleto: emptyToNull(data.nome_completo),
        cargo: emptyToNull(data.cargo),
        unidade: emptyToNull(data.unidade),
        telefone: emptyToNull(data.telefone),
        bio: emptyToNull(data.bio),
        avatarUrl: emptyToNull(data.avatar_url),
      },
      update: {
        nomeCompleto: emptyToNull(data.nome_completo),
        cargo: emptyToNull(data.cargo),
        unidade: emptyToNull(data.unidade),
        telefone: emptyToNull(data.telefone),
        bio: emptyToNull(data.bio),
        avatarUrl: emptyToNull(data.avatar_url),
      },
    });

    return {
      id: profile.id,
      nome_completo: profile.nomeCompleto,
      cargo: profile.cargo,
      unidade: profile.unidade,
      telefone: profile.telefone,
      bio: profile.bio,
      avatar_url: profile.avatarUrl,
      status: profile.status,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    };
  });