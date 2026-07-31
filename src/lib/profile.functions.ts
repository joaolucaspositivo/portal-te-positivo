// Gestão do próprio perfil (usuário autenticado).
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "./auth-middleware.local";
import { MyProfileInput } from "./profile-schemas";

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => MyProfileInput.parse(data))
  .handler(async ({ data, context }) => {
    const { prisma } = await import("./db.server");
    const { serializeProfile } = await import("./prisma-helpers.server");
    const row = await prisma.profile.update({
      where: { id: context.userId },
      data: {
        nomeCompleto: data.nome_completo ?? null,
        cargo: data.cargo ?? null,
        unidade: data.unidade ?? null,
        telefone: data.telefone ?? null,
        bio: data.bio ?? null,
        avatarUrl: data.avatar_url ?? null,
      },
    });
    return serializeProfile(row);
  });
