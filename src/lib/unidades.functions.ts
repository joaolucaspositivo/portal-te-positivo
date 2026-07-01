import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";

function assertAdmin(ctx: { roles?: string[] }) {
  if (!ctx.roles?.includes("admin")) {
    throw new Error("Forbidden");
  }
}

const UnidadeInput = z.object({
  nome: z.string().trim().min(1).max(160),
  sigla: z.string().trim().min(1).max(40),
  status: z.enum(["ativa", "inativa"]).default("ativa"),
  cep: z.string().trim().max(20).nullable().optional(),
  logradouro: z.string().trim().max(200).nullable().optional(),
  numero: z.string().trim().max(20).nullable().optional(),
  complemento: z.string().trim().max(120).nullable().optional(),
  bairro: z.string().trim().max(120).nullable().optional(),
  cidade: z.string().trim().max(120).nullable().optional(),
  estado: z.string().trim().max(2).nullable().optional(),
  telefone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().email().max(160).nullable().optional().or(z.literal("")),
  responsavel_nome: z.string().trim().max(160).nullable().optional(),
  responsavel_cargo: z.string().trim().max(160).nullable().optional(),
});

function toUnidadeData(data: any) {
  return {
    nome: data.nome,
    sigla: data.sigla,
    status: data.status,
    cep: data.cep ?? null,
    logradouro: data.logradouro ?? null,
    numero: data.numero ?? null,
    complemento: data.complemento ?? null,
    bairro: data.bairro ?? null,
    cidade: data.cidade ?? null,
    estado: data.estado ?? null,
    telefone: data.telefone ?? null,
    email: data.email === "" ? null : data.email ?? null,
    responsavelNome: data.responsavel_nome ?? null,
    responsavelCargo: data.responsavel_cargo ?? null,
  };
}

function toUnidadeUpdateData(data: any) {
  const payload: any = {};

  for (const key of [
    "nome",
    "sigla",
    "status",
    "cep",
    "logradouro",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "estado",
    "telefone",
    "email",
    "responsavel_nome",
    "responsavel_cargo",
  ]) {
    if (!(key in data)) continue;

    if (key === "responsavel_nome") {
      payload.responsavelNome = data[key] ?? null;
    } else if (key === "responsavel_cargo") {
      payload.responsavelCargo = data[key] ?? null;
    } else if (key === "email") {
      payload.email = data[key] === "" ? null : data[key] ?? null;
    } else {
      payload[key] = data[key] ?? null;
    }
  }

  return payload;
}

function toUnidadeRow(u: any, usuariosCount = 0) {
  if (!u) return null;

  return {
    id: u.id,
    nome: u.nome,
    sigla: u.sigla,
    status: u.status,
    cep: u.cep,
    logradouro: u.logradouro,
    numero: u.numero,
    complemento: u.complemento,
    bairro: u.bairro,
    cidade: u.cidade,
    estado: u.estado,
    telefone: u.telefone,
    email: u.email,
    responsavel_nome: u.responsavelNome,
    responsavel_cargo: u.responsavelCargo,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
    usuarios_count: usuariosCount,
  };
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

export const listUnidadesPublicas = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("./db.server");

  const unidades = await prisma.unidade.findMany({
    where: {
      status: "ativa",
    },
    orderBy: {
      nome: "asc",
    },
  });

  return unidades.map((u) => ({
    id: u.id,
    nome: u.nome,
    sigla: u.sigla,
    status: u.status,
  }));
});

export const listUnidades = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const unidades = await prisma.unidade.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: {
            usuarios: true,
          },
        },
      },
    });

    return unidades.map((u) => toUnidadeRow(u, u._count.usuarios));
  });

export const getUnidade = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const unidade = await prisma.unidade.findUnique({
      where: {
        id: data.id,
      },
    });

    return toUnidadeRow(unidade);
  });

export const createUnidade = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => UnidadeInput.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const row = await prisma.unidade.create({
      data: toUnidadeData(data),
    });

    return toUnidadeRow(row);
  });

export const updateUnidade = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    UnidadeInput.partial().extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const { id, ...rest } = data as any;

    await prisma.unidade.update({
      where: {
        id,
      },
      data: toUnidadeUpdateData(rest),
    });

    return { ok: true };
  });

export const setUnidadeStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["ativa", "inativa"]),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.unidade.update({
      where: {
        id: data.id,
      },
      data: {
        status: data.status,
      },
    });

    return { ok: true };
  });

export const deleteUnidade = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const [vinculosCount, solicitacoesCount] = await Promise.all([
      prisma.usuarioUnidade.count({
        where: {
          unidadeId: data.id,
        },
      }),
      prisma.solicitacao.count({
        where: {
          unidadeId: data.id,
        },
      }),
    ]);

    if (vinculosCount > 0 || solicitacoesCount > 0) {
      throw new Error(
        "Esta unidade possui usuários vinculados ou solicitações. Desative-a em vez de excluir.",
      );
    }

    await prisma.unidade.delete({
      where: {
        id: data.id,
      },
    });

    return { ok: true };
  });

export const listUsuariosDaUnidade = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ unidadeId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const vinculos = await prisma.usuarioUnidade.findMany({
      where: {
        unidadeId: data.unidadeId,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return vinculos.map((v) => ({
      user_id: v.userId,
      principal: v.principal,
      created_at: v.createdAt,
      email: v.user.email,
      profile: toProfileRow(v.user.profile),
    }));
  });

export const listMinhasUnidades = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    const { prisma } = await import("./db.server");

    const vinculos = await prisma.usuarioUnidade.findMany({
      where: {
        userId: ctx.userId,
      },
      orderBy: {
        createdAt: "asc",
      },
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
    });

    return vinculos
      .filter((v) => v.unidade.status === "ativa")
      .map((v) => ({
        unidade_id: v.unidadeId,
        principal: v.principal,
        nome: v.unidade.nome,
        sigla: v.unidade.sigla,
      }));
  });

export const listUnidadesDoUsuario = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const vinculos = await prisma.usuarioUnidade.findMany({
      where: {
        userId: data.userId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        unidadeId: true,
        principal: true,
      },
    });

    return vinculos.map((v) => ({
      unidade_id: v.unidadeId,
      principal: v.principal,
    }));
  });

export const setUserUnidades = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({
      userId: z.string().uuid(),
      unidadeIds: z.array(z.string().uuid()),
      principalId: z.string().uuid().nullable().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const unidadeIds = Array.from(new Set(data.unidadeIds));

    const principalId =
      data.principalId && unidadeIds.includes(data.principalId)
        ? data.principalId
        : unidadeIds[0] ?? null;

    await prisma.$transaction(async (tx) => {
      await tx.usuarioUnidade.deleteMany({
        where: {
          userId: data.userId,
        },
      });

      if (unidadeIds.length === 0) return;

      await tx.usuarioUnidade.createMany({
        data: unidadeIds.map((unidadeId) => ({
          userId: data.userId,
          unidadeId,
          principal: principalId === unidadeId,
        })),
      });
    });

    return { ok: true };
  });

export const vincularUsuario = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({
      unidadeId: z.string().uuid(),
      userId: z.string().uuid(),
      principal: z.boolean().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.$transaction(async (tx) => {
      const existentes = await tx.usuarioUnidade.findMany({
        where: {
          userId: data.userId,
        },
        select: {
          principal: true,
        },
      });

      const hasPrincipal = existentes.some((v) => v.principal);
      const principal = data.principal ?? !hasPrincipal;

      if (principal) {
        await tx.usuarioUnidade.updateMany({
          where: {
            userId: data.userId,
          },
          data: {
            principal: false,
          },
        });
      }

      await tx.usuarioUnidade.upsert({
        where: {
          userId_unidadeId: {
            userId: data.userId,
            unidadeId: data.unidadeId,
          },
        },
        create: {
          userId: data.userId,
          unidadeId: data.unidadeId,
          principal,
        },
        update: {
          principal,
        },
      });
    });

    return { ok: true };
  });

export const desvincularUsuario = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({
      unidadeId: z.string().uuid(),
      userId: z.string().uuid(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.$transaction(async (tx) => {
      const atual = await tx.usuarioUnidade.findUnique({
        where: {
          userId_unidadeId: {
            userId: data.userId,
            unidadeId: data.unidadeId,
          },
        },
      });

      if (!atual) return;

      const wasPrincipal = atual.principal === true;

      await tx.usuarioUnidade.delete({
        where: {
          userId_unidadeId: {
            userId: data.userId,
            unidadeId: data.unidadeId,
          },
        },
      });

      if (!wasPrincipal) return;

      const restante = await tx.usuarioUnidade.findFirst({
        where: {
          userId: data.userId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (!restante) return;

      await tx.usuarioUnidade.update({
        where: {
          userId_unidadeId: {
            userId: restante.userId,
            unidadeId: restante.unidadeId,
          },
        },
        data: {
          principal: true,
        },
      });
    });

    return { ok: true };
  });

export const definirUnidadePrincipal = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({
      unidadeId: z.string().uuid(),
      userId: z.string().uuid(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.$transaction([
      prisma.usuarioUnidade.updateMany({
        where: {
          userId: data.userId,
        },
        data: {
          principal: false,
        },
      }),
      prisma.usuarioUnidade.update({
        where: {
          userId_unidadeId: {
            userId: data.userId,
            unidadeId: data.unidadeId,
          },
        },
        data: {
          principal: true,
        },
      }),
    ]);

    return { ok: true };
  });