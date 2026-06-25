import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";

function assertEditor(ctx: { roles?: string[] }) {
  const roles = ctx.roles ?? [];

  if (!roles.includes("admin") && !roles.includes("equipe_te") && !roles.includes("editor")) {
    throw new Error("Forbidden");
  }
}

async function getOptionalUserId() {
  const authHeader = getRequestHeader("authorization");

  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length);

  try {
    const { verifyAccessToken } = await import("./auth.server");
    const payload = verifyAccessToken(token);

    return payload.sub;
  } catch {
    return null;
  }
}

function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function toFerramentaRow(f: any) {
  return {
    id: f.id,
    nome: f.nome,
    descricao: f.descricao,
    categoria: f.categoria,
    publico_alvo: f.publicoAlvo,
    segmento: f.segmento,
    link_acesso: f.linkAcesso,
    responsavel: f.responsavel,
    imagem_url: f.imagemUrl,
    status: f.status,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
  };
}

function toComunicadoRow(c: any) {
  return {
    id: c.id,
    titulo: c.titulo,
    resumo: c.resumo,
    conteudo: c.conteudo,
    categoria: c.categoria,
    autor: c.autor,
    imagem_url: c.imagemUrl,
    data_publicacao: c.dataPublicacao,
    destaque: c.destaque,
    publicado: c.publicado,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

function toContatoRow(c: any, options?: { isAuthed?: boolean }) {
  const isAuthed = options?.isAuthed ?? true;

  return {
    id: c.id,
    user_id: c.userId,
    nome: c.nome,
    funcao: c.funcao,
    unidade: c.unidade,
    email: isAuthed ? c.email : null,
    telefone_whatsapp: isAuthed ? c.telefoneWhatsapp : null,
    tipo_contato: c.tipoContato,
    ativo: c.ativo,
    avatar_url: c.user?.profile?.avatarUrl ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

export const listFerramentasPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("./db.server");

  const ferramentas = await prisma.ferramenta.findMany({
    orderBy: {
      nome: "asc",
    },
  });

  return ferramentas.map(toFerramentaRow);
});

export const listFerramentasAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    const ferramentas = await prisma.ferramenta.findMany({
      orderBy: {
        nome: "asc",
      },
    });

    return ferramentas.map(toFerramentaRow);
  });

const FerramentaSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(1).max(160),
  descricao: z.string().trim().max(2000).optional().nullable(),
  categoria: z.string().trim().max(120).optional().nullable(),
  publico_alvo: z.string().trim().max(160).optional().nullable(),
  segmento: z.string().trim().max(160).optional().nullable(),
  link_acesso: z.string().trim().max(500).optional().nullable(),
  responsavel: z.string().trim().max(160).optional().nullable(),
  status: z.string().trim().min(1).max(80).default("Ativa"),
  imagem_url: z.string().trim().max(500).optional().nullable(),
});

export const saveFerramentaAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => FerramentaSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    const payload = {
      nome: data.nome,
      descricao: emptyToNull(data.descricao),
      categoria: emptyToNull(data.categoria),
      publicoAlvo: emptyToNull(data.publico_alvo),
      segmento: emptyToNull(data.segmento),
      linkAcesso: emptyToNull(data.link_acesso),
      responsavel: emptyToNull(data.responsavel),
      status: data.status,
      imagemUrl: emptyToNull(data.imagem_url),
    };

    const ferramenta = data.id
      ? await prisma.ferramenta.update({
          where: {
            id: data.id,
          },
          data: payload,
        })
      : await prisma.ferramenta.create({
          data: payload,
        });

    return toFerramentaRow(ferramenta);
  });

export const deleteFerramentaAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    await prisma.ferramenta.delete({
      where: {
        id: data.id,
      },
    });

    return { ok: true };
  });

export const listComunicadosPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("./db.server");

  const comunicados = await prisma.comunicado.findMany({
    where: {
      publicado: true,
    },
    orderBy: {
      dataPublicacao: "desc",
    },
  });

  return comunicados.map(toComunicadoRow);
});

export const listComunicadosAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    const comunicados = await prisma.comunicado.findMany({
      orderBy: {
        dataPublicacao: "desc",
      },
    });

    return comunicados.map(toComunicadoRow);
  });

const ComunicadoSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().trim().min(1).max(220),
  resumo: z.string().trim().max(1000).optional().nullable(),
  conteudo: z.string().trim().min(1),
  categoria: z.string().trim().max(120).optional().nullable(),
  autor: z.string().trim().max(160).optional().nullable(),
  data_publicacao: z.string().trim().min(1),
  destaque: z.boolean().default(false),
  publicado: z.boolean().default(true),
  imagem_url: z.string().trim().max(500).optional().nullable(),
});

export const saveComunicadoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ComunicadoSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    const payload = {
      titulo: data.titulo,
      resumo: emptyToNull(data.resumo),
      conteudo: data.conteudo,
      categoria: emptyToNull(data.categoria),
      autor: emptyToNull(data.autor),
      dataPublicacao: new Date(`${data.data_publicacao}T00:00:00`),
      destaque: data.destaque,
      publicado: data.publicado,
      imagemUrl: emptyToNull(data.imagem_url),
    };

    const comunicado = data.id
      ? await prisma.comunicado.update({
          where: {
            id: data.id,
          },
          data: payload,
        })
      : await prisma.comunicado.create({
          data: payload,
        });

    return toComunicadoRow(comunicado);
  });

export const deleteComunicadoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    await prisma.comunicado.delete({
      where: {
        id: data.id,
      },
    });

    return { ok: true };
  });

export const listContatosPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("./db.server");

  const userId = await getOptionalUserId();
  const isAuthed = !!userId;

  const contatos = await prisma.contato.findMany({
    where: {
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  return contatos.map((c) => toContatoRow(c, { isAuthed }));
});

export const listContatosAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    const contatos = await prisma.contato.findMany({
      orderBy: {
        nome: "asc",
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return contatos.map((c) => toContatoRow(c, { isAuthed: true }));
  });

export const listProfileOptionsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    const profiles = await prisma.profile.findMany({
      where: {
        status: "ativo",
      },
      orderBy: {
        nomeCompleto: "asc",
      },
    });

    return profiles.map((p) => ({
      id: p.id,
      nome_completo: p.nomeCompleto,
      cargo: p.cargo,
      unidade: p.unidade,
    }));
  });

const ContatoSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional().nullable(),
  nome: z.string().trim().min(1).max(160),
  funcao: z.string().trim().max(160).optional().nullable(),
  unidade: z.string().trim().max(160).optional().nullable(),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")),
  telefone_whatsapp: z.string().trim().max(60).optional().nullable(),
  tipo_contato: z.string().trim().max(120).optional().nullable(),
  ativo: z.boolean().default(true),
});

export const saveContatoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ContatoSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    const payload = {
      userId: data.user_id ?? null,
      nome: data.nome,
      funcao: emptyToNull(data.funcao),
      unidade: emptyToNull(data.unidade),
      email: emptyToNull(data.email),
      telefoneWhatsapp: emptyToNull(data.telefone_whatsapp),
      tipoContato: emptyToNull(data.tipo_contato),
      ativo: data.ativo,
    };

    const contato = data.id
      ? await prisma.contato.update({
          where: {
            id: data.id,
          },
          data: payload,
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        })
      : await prisma.contato.create({
          data: payload,
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        });

    return toContatoRow(contato, { isAuthed: true });
  });

export const deleteContatoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertEditor(context as any);

    const { prisma } = await import("./db.server");

    await prisma.contato.delete({
      where: {
        id: data.id,
      },
    });

    return { ok: true };
  });