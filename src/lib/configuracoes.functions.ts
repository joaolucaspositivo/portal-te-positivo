import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";

const ConfiguracaoGrupoSchema = z.enum([
  "categoria_comunicado",
  "status_solicitacao",
  "prioridade_solicitacao",
]);

type ConfiguracaoGrupo = z.infer<typeof ConfiguracaoGrupoSchema>;

function assertAdmin(ctx: { roles?: string[] }) {
  if (!ctx.roles?.includes("admin")) {
    throw new Error("Forbidden");
  }
}

function metaValue(meta: any, key: string) {
  if (!meta || typeof meta !== "object") return null;
  return meta[key] ?? null;
}

function toOpcaoRow(opcao: any) {
  const meta = opcao.meta ?? {};

  return {
    id: opcao.id,
    grupo: opcao.grupo,
    slug: opcao.slug,
    nome: opcao.nome,
    descricao: opcao.descricao,
    cor: opcao.cor,
    ativo: opcao.ativo,
    ordem: opcao.ordem,
    padrao: opcao.padrao,
    meta,
    aberta: !!metaValue(meta, "aberta"),
    peso: Number(metaValue(meta, "peso") ?? 0),
    created_at: opcao.createdAt,
    updated_at: opcao.updatedAt,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function buildMeta(data: {
  grupo: ConfiguracaoGrupo;
  aberta?: boolean | null;
  peso?: number | null;
}) {
  if (data.grupo === "status_solicitacao") {
    return {
      aberta: !!data.aberta,
    };
  }

  if (data.grupo === "prioridade_solicitacao") {
    return {
      peso: Number(data.peso ?? 0),
    };
  }

  return null;
}

const ListSchema = z.object({
  grupo: ConfiguracaoGrupoSchema,
});

const SaveSchema = z.object({
  id: z.string().uuid().optional(),
  grupo: ConfiguracaoGrupoSchema,
  slug: z.string().trim().max(80).optional().nullable(),
  nome: z.string().trim().min(1).max(160),
  descricao: z.string().trim().max(1000).optional().nullable(),
  cor: z.string().trim().max(80).optional().nullable(),
  ativo: z.boolean().default(true),
  ordem: z.coerce.number().int().default(0),
  padrao: z.boolean().default(false),
  aberta: z.boolean().optional().nullable(),
  peso: z.coerce.number().int().optional().nullable(),
});

export const listConfiguracaoOpcoesAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => ListSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const opcoes = await prisma.configuracaoOpcao.findMany({
      where: {
        grupo: data.grupo,
      },
      orderBy: [
        {
          ordem: "asc",
        },
        {
          nome: "asc",
        },
      ],
    });

    return opcoes.map(toOpcaoRow);
  });

export const listConfiguracaoOpcoesPublic = createServerFn({ method: "GET" })
  .validator((data: unknown) => ListSchema.parse(data))
  .handler(async ({ data }) => {
    const { prisma } = await import("./db.server");

    const opcoes = await prisma.configuracaoOpcao.findMany({
      where: {
        grupo: data.grupo,
        ativo: true,
      },
      orderBy: [
        {
          ordem: "asc",
        },
        {
          nome: "asc",
        },
      ],
    });

    return opcoes.map(toOpcaoRow);
  });

export const saveConfiguracaoOpcaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => SaveSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const slug = data.slug?.trim() || slugify(data.nome);
    const meta = buildMeta(data);

    const payload = {
      grupo: data.grupo,
      slug,
      nome: data.nome,
      descricao: data.descricao?.trim() || null,
      cor: data.cor?.trim() || null,
      ativo: data.ativo,
      ordem: data.ordem,
      padrao: data.padrao,
      meta,
    };

    if (data.padrao) {
      await prisma.configuracaoOpcao.updateMany({
        where: {
          grupo: data.grupo,
          ...(data.id
            ? {
                id: {
                  not: data.id,
                },
              }
            : {}),
        },
        data: {
          padrao: false,
        },
      });
    }

    const opcao = data.id
      ? await prisma.configuracaoOpcao.update({
          where: {
            id: data.id,
          },
          data: payload,
        })
      : await prisma.configuracaoOpcao.create({
          data: payload,
        });

    return toOpcaoRow(opcao);
  });

export const deleteConfiguracaoOpcaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.configuracaoOpcao.update({
      where: {
        id: data.id,
      },
      data: {
        ativo: false,
      },
    });

    return { ok: true };
  });

export const listCategoriasComunicadoPublic = createServerFn({ method: "GET" }).handler(
  async () => {
    const { prisma } = await import("./db.server");

    const opcoes = await prisma.configuracaoOpcao.findMany({
      where: {
        grupo: "categoria_comunicado",
        ativo: true,
      },
      orderBy: [
        {
          ordem: "asc",
        },
        {
          nome: "asc",
        },
      ],
    });

    return opcoes.map(toOpcaoRow);
  },
);

export const listStatusSolicitacaoPublic = createServerFn({ method: "GET" }).handler(
  async () => {
    const { prisma } = await import("./db.server");

    const opcoes = await prisma.configuracaoOpcao.findMany({
      where: {
        grupo: "status_solicitacao",
        ativo: true,
      },
      orderBy: [
        {
          ordem: "asc",
        },
        {
          nome: "asc",
        },
      ],
    });

    return opcoes.map(toOpcaoRow);
  },
);

export const listPrioridadesSolicitacaoPublic = createServerFn({ method: "GET" }).handler(
  async () => {
    const { prisma } = await import("./db.server");

    const opcoes = await prisma.configuracaoOpcao.findMany({
      where: {
        grupo: "prioridade_solicitacao",
        ativo: true,
      },
      orderBy: [
        {
          ordem: "asc",
        },
        {
          nome: "asc",
        },
      ],
    });

    return opcoes.map(toOpcaoRow);
  },
);