import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";

function assertEquipeTE(ctx: { roles?: string[] }) {
  const roles = ctx.roles ?? [];

  if (!roles.includes("admin") && !roles.includes("equipe_te")) {
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
  };
}

function toSolicitacaoRow(s: any) {
  return {
    id: s.id,
    tipo_id: s.tipoId,
    unidade_id: s.unidadeId,
    solicitante_id: s.solicitanteId,
    responsavel_id: s.responsavelId,

    nome_solicitante: s.nomeSolicitante,
    email_solicitante: s.emailSolicitante,
    unidade: s.unidade,
    segmento_area: s.segmentoArea,
    cargo_funcao: s.cargoFuncao,
    tipo_solicitacao: s.tipoSolicitacao,
    titulo: s.titulo,
    descricao: s.descricao,
    publico_impactado: s.publicoImpactado,
    unidades_impactadas: s.unidadesImpactadas,
    prazo_desejado: s.prazoDesejado,
    urgencia: s.urgencia,
    link_referencia: s.linkReferencia,
    observacoes_adicionais: s.observacoesAdicionais,
    respostas: s.dadosExtras,
    dados_extras: s.dadosExtras,
    anexos_urls: s.anexosUrls,
    status: s.status,
    responsavel_te: s.responsavelTe,
    observacoes_internas: s.observacoesInternas,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export const listSolicitacaoTiposPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("./db.server");

  const tipos = await prisma.solicitacaoTipo.findMany({
    where: {
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

  return tipos.map(toTipoRow);
});

export const getSolicitacaoTipoPublic = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { prisma } = await import("./db.server");

    const tipo = await prisma.solicitacaoTipo.findFirst({
      where: {
        slug: data.slug,
        ativo: true,
      },
    });

    return tipo ? toTipoRow(tipo) : null;
  });

export const listCamposSolicitacaoPublic = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ tipoId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { prisma } = await import("./db.server");

    const campos = await prisma.solicitacaoCampo.findMany({
      where: {
        tipoId: data.tipoId,
        ativo: true,
      },
      orderBy: {
        ordem: "asc",
      },
    });

    return campos.map(toCampoRow);
  });

const CreateSolicitacaoSchema = z.object({
  tipoId: z.string().uuid(),
  nome_solicitante: z.string().trim().min(1).max(160),
  email_solicitante: z.string().trim().email().max(160),
  unidade: z.string().trim().min(1).max(160),
  unidade_id: z.string().uuid().nullable().optional(),
  cargo_funcao: z.string().trim().max(160).optional().nullable(),
  titulo: z.string().trim().min(1).max(220),
  descricao: z.string().trim().min(1).max(6000),
  urgencia: z.string().trim().min(1).max(40),
  respostas: z.record(z.any()).optional(),
});

export const createSolicitacaoPublic = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CreateSolicitacaoSchema.parse(data))
  .handler(async ({ data }) => {
    const { prisma } = await import("./db.server");

    const tipo = await prisma.solicitacaoTipo.findFirst({
      where: {
        id: data.tipoId,
        ativo: true,
      },
    });

    if (!tipo) {
      throw new Error("Tipo de solicitação não encontrado.");
    }

    const userId = await getOptionalUserId();

    if (!tipo.permiteAnonimo && !userId) {
      throw new Error("É necessário entrar para abrir este tipo de solicitação.");
    }

    const created = await prisma.solicitacao.create({
      data: {
        tipoId: tipo.id,
        unidadeId: data.unidade_id ?? null,
        solicitanteId: userId,

        nomeSolicitante: data.nome_solicitante,
        emailSolicitante: data.email_solicitante,
        unidade: data.unidade,
        cargoFuncao: data.cargo_funcao ?? null,
        tipoSolicitacao: tipo.nome,
        titulo: data.titulo,
        descricao: data.descricao,
        urgencia: data.urgencia,
        dadosExtras: data.respostas ?? {},
        status: "Recebida",
      },
    });

    return toSolicitacaoRow(created);
  });

export const listSolicitacoesAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertEquipeTE(context as any);

    const { prisma } = await import("./db.server");

    const solicitacoes = await prisma.solicitacao.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return solicitacoes.map(toSolicitacaoRow);
  });

export const getSolicitacaoAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertEquipeTE(context as any);

    const { prisma } = await import("./db.server");

    const solicitacao = await prisma.solicitacao.findUnique({
      where: {
        id: data.id,
      },
    });

    return solicitacao ? toSolicitacaoRow(solicitacao) : null;
  });

export const listEquipeTeOptions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertEquipeTE(context as any);

    const { prisma } = await import("./db.server");

    const users = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              in: ["admin", "equipe_te"],
            },
          },
        },
      },
      include: {
        profile: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      nome_completo: u.profile?.nomeCompleto ?? u.email,
    }));
  });

const UpdateSolicitacaoSchema = z.object({
  id: z.string().uuid(),
  status: z.string().trim().min(1).max(80),
  responsavel_te: z.string().trim().max(160).optional().nullable(),
  observacoes_internas: z.string().trim().max(6000).optional().nullable(),
  responsavel_id: z.string().uuid().nullable().optional(),
});

export const updateSolicitacaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => UpdateSolicitacaoSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertEquipeTE(context as any);

    const { prisma } = await import("./db.server");

    const updated = await prisma.solicitacao.update({
      where: {
        id: data.id,
      },
      data: {
        status: data.status,
        responsavelTe: data.responsavel_te ?? null,
        observacoesInternas: data.observacoes_internas ?? null,
        responsavelId: data.responsavel_id ?? null,
      },
    });

    return toSolicitacaoRow(updated);
  });

export const deleteSolicitacaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertEquipeTE(context as any);

    const { prisma } = await import("./db.server");

    await prisma.solicitacao.delete({
      where: {
        id: data.id,
      },
    });

    return { ok: true };
  });