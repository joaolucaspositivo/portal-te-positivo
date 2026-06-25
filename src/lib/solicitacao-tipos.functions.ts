import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";

function assertAdmin(ctx: { roles?: string[] }) {
  if (!ctx.roles?.includes("admin")) {
    throw new Error("Forbidden");
  }
}

function toTipoRow(tipo: any) {
  return {
    id: tipo.id,
    nome: tipo.nome,
    slug: tipo.slug,
    descricao: tipo.descricao,
    icone: tipo.icone,
    cor: tipo.cor,
    ativo: tipo.ativo,
    ordem: tipo.ordem,
    prazo_dias: tipo.prazoDias,
    permite_anonimo: tipo.permiteAnonimo,
    created_at: tipo.createdAt,
    updated_at: tipo.updatedAt,
  };
}

function toCampoRow(campo: any) {
  return {
    id: campo.id,
    tipo_id: campo.tipoId,
    chave: campo.chave,
    label: campo.rotulo,
    tipo_campo: campo.tipoCampo,
    obrigatorio: campo.obrigatorio,
    opcoes: campo.opcoes,
    placeholder: campo.placeholder,
    help_text: campo.ajuda,
    ordem: campo.ordem,
    ativo: campo.ativo,
    created_at: campo.createdAt,
    updated_at: campo.updatedAt,
  };
}

const TipoSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(80),
  descricao: z.string().trim().max(1000).optional().nullable(),
  icone: z.string().trim().max(80).optional().nullable(),
  ordem: z.coerce.number().int().default(0),
  ativo: z.boolean().default(true),
  permite_anonimo: z.boolean().default(true),
});

export const listTiposSolicitacaoAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const tipos = await prisma.solicitacaoTipo.findMany({
      orderBy: [
        {
          ordem: "asc",
        },
        {
          nome: "asc",
        },
      ],
    });

    return tipos.map(toTipoRow);
  });

export const getTipoSolicitacaoAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const tipo = await prisma.solicitacaoTipo.findUnique({
      where: {
        id: data.id,
      },
    });

    return tipo ? toTipoRow(tipo) : null;
  });

export const saveTipoSolicitacaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => TipoSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const payload = {
      nome: data.nome,
      slug: data.slug,
      descricao: data.descricao ?? null,
      icone: data.icone ?? null,
      ordem: data.ordem,
      ativo: data.ativo,
      permiteAnonimo: data.permite_anonimo,
    };

    const tipo = data.id
      ? await prisma.solicitacaoTipo.update({
          where: {
            id: data.id,
          },
          data: payload,
        })
      : await prisma.solicitacaoTipo.create({
          data: payload,
        });

    return toTipoRow(tipo);
  });

export const deleteTipoSolicitacaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.solicitacaoTipo.delete({
      where: {
        id: data.id,
      },
    });

    return { ok: true };
  });

export const listCamposTipoAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ tipoId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const campos = await prisma.solicitacaoCampo.findMany({
      where: {
        tipoId: data.tipoId,
      },
      orderBy: [
        {
          ordem: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return campos.map(toCampoRow);
  });

const CampoSchema = z.object({
  id: z.string().uuid().optional(),
  tipo_id: z.string().uuid(),
  label: z.string().trim().min(1).max(160),
  chave: z.string().trim().min(1).max(80),
  tipo_campo: z.string().trim().min(1).max(40),
  obrigatorio: z.boolean().default(false),
  placeholder: z.string().trim().max(200).optional().nullable(),
  help_text: z.string().trim().max(500).optional().nullable(),
  ordem: z.coerce.number().int().default(0),
  opcoes: z.any().optional(),
  ativo: z.boolean().default(true),
});

export const saveCampoTipoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => CampoSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    const payload = {
      tipoId: data.tipo_id,
      rotulo: data.label,
      chave: data.chave,
      tipoCampo: data.tipo_campo,
      obrigatorio: data.obrigatorio,
      placeholder: data.placeholder ?? null,
      ajuda: data.help_text ?? null,
      ordem: data.ordem,
      opcoes: data.opcoes ?? [],
      ativo: data.ativo,
    };

    const campo = data.id
      ? await prisma.solicitacaoCampo.update({
          where: {
            id: data.id,
          },
          data: payload,
        })
      : await prisma.solicitacaoCampo.create({
          data: payload,
        });

    return toCampoRow(campo);
  });

export const deleteCampoTipoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.solicitacaoCampo.delete({
      where: {
        id: data.id,
      },
    });

    return { ok: true };
  });

export const reorderCamposTipoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        firstId: z.string().uuid(),
        firstOrdem: z.number().int(),
        secondId: z.string().uuid(),
        secondOrdem: z.number().int(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { prisma } = await import("./db.server");

    await prisma.$transaction([
      prisma.solicitacaoCampo.update({
        where: {
          id: data.firstId,
        },
        data: {
          ordem: data.firstOrdem,
        },
      }),
      prisma.solicitacaoCampo.update({
        where: {
          id: data.secondId,
        },
        data: {
          ordem: data.secondOrdem,
        },
      }),
    ]);

    return { ok: true };
  });