import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";
import {
  getUrgenciaPeso,
  normalizeSolicitacaoStatus,
  normalizeSolicitacaoUrgencia,
  SOLICITACAO_STATUS,
  SOLICITACAO_URGENCIAS,
} from "@/lib/solicitacoes.constants";

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
    const { canProfileAccess } = await import("./auth-policy.server");
    const { loadUserWithRoles } = await import("./auth.server");

    const payload = verifyAccessToken(token);
    const user = await loadUserWithRoles(payload.sub);

    if (!user || !canProfileAccess(user.profile?.status)) return null;

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

function toResponsavelRow(user: any) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    nome_completo: user.profile?.nomeCompleto ?? user.email,
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
    urgencia: normalizeSolicitacaoUrgencia(s.urgencia),
    urgencia_peso: getUrgenciaPeso(s.urgencia),
    link_referencia: s.linkReferencia,
    observacoes_adicionais: s.observacoesAdicionais,
    respostas: s.dadosExtras,
    dados_extras: s.dadosExtras,
    anexos_urls: s.anexosUrls,
    status: normalizeSolicitacaoStatus(s.status),
    responsavel_te: s.responsavelTe,
    responsavel: toResponsavelRow(s.responsavel),
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
  .validator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
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
  .validator((data: unknown) => z.object({ tipoId: z.string().uuid() }).parse(data))
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
  .validator((data: unknown) => CreateSolicitacaoSchema.parse(data))
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

    const unidadeSelecionada = data.unidade_id
      ? await prisma.unidade.findFirst({
        where: {
          id: data.unidade_id,
          status: "ativa",
        },
      })
      : await prisma.unidade.findFirst({
        where: {
          nome: data.unidade,
          status: "ativa",
        },
      });

    if (!unidadeSelecionada) {
      throw new Error("Selecione uma unidade válida.");
    }

    const created = await prisma.solicitacao.create({
      data: {
        tipoId: tipo.id,
        unidadeId: unidadeSelecionada.id,
        solicitanteId: userId,

        nomeSolicitante: data.nome_solicitante,
        emailSolicitante: data.email_solicitante,
        unidade: unidadeSelecionada.nome,
        cargoFuncao: data.cargo_funcao ?? null,
        tipoSolicitacao: tipo.nome,
        titulo: data.titulo,
        descricao: data.descricao,
        urgencia: normalizeSolicitacaoUrgencia(data.urgencia),
        dadosExtras: data.respostas ?? {},
        status: "Recebida",
      },
      include: {
        responsavel: {
          include: {
            profile: true,
          },
        },
      },
    });

    return toSolicitacaoRow(created);
  });

const ListSolicitacoesAdminSchema = z
  .object({
    status: z.string().optional().nullable(),
    urgencia: z.string().optional().nullable(),
    responsavel_id: z.string().uuid().optional().nullable(),
    apenas_abertas: z.boolean().optional(),
  })
  .optional();

export const listSolicitacoesAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => ListSolicitacoesAdminSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertEquipeTE(context as any);

    const { prisma } = await import("./db.server");

    const filters = data ?? {};

    const where: any = {};

    if (filters.status) {
      where.status = normalizeSolicitacaoStatus(filters.status);
    }

    if (filters.urgencia) {
      where.urgencia = normalizeSolicitacaoUrgencia(filters.urgencia);
    }

    if (filters.responsavel_id) {
      where.responsavelId = filters.responsavel_id;
    }

    if (filters.apenas_abertas) {
      where.status = {
        in: ["Recebida", "Em análise", "Aguardando validação", "Em andamento"],
      };
    }

    const solicitacoes = await prisma.solicitacao.findMany({
      where,
      include: {
        responsavel: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return solicitacoes
      .map(toSolicitacaoRow)
      .sort((a, b) => {
        if (a.status !== b.status) {
          const aAberta = ["Recebida", "Em análise", "Aguardando validação", "Em andamento"].includes(
            a.status,
          );
          const bAberta = ["Recebida", "Em análise", "Aguardando validação", "Em andamento"].includes(
            b.status,
          );

          if (aAberta !== bAberta) return aAberta ? -1 : 1;
        }

        if (a.urgencia_peso !== b.urgencia_peso) {
          return b.urgencia_peso - a.urgencia_peso;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  });

export const getSolicitacaoAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertEquipeTE(context as any);

    const { prisma } = await import("./db.server");

    const solicitacao = await prisma.solicitacao.findUnique({
      where: {
        id: data.id,
      },
      include: {
        responsavel: {
          include: {
            profile: true,
          },
        },
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
        profile: {
          status: "ativo",
        },
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
  status: z.enum(SOLICITACAO_STATUS),
  urgencia: z.enum(SOLICITACAO_URGENCIAS).optional(),
  responsavel_te: z.string().trim().max(160).optional().nullable(),
  observacoes_internas: z.string().trim().max(6000).optional().nullable(),
  responsavel_id: z.string().uuid().nullable().optional(),
});

export const updateSolicitacaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => UpdateSolicitacaoSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertEquipeTE(context as any);

    const { prisma } = await import("./db.server");

    const responsavel = data.responsavel_id
      ? await prisma.user.findFirst({
        where: {
          id: data.responsavel_id,
          profile: {
            status: "ativo",
          },
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
      })
      : null;

    if (data.responsavel_id && !responsavel) {
      throw new Error("Responsável selecionado não está ativo ou não pertence à equipe TE.");
    }

    const updated = await prisma.solicitacao.update({
      where: {
        id: data.id,
      },
      data: {
        status: normalizeSolicitacaoStatus(data.status),
        urgencia: data.urgencia ? normalizeSolicitacaoUrgencia(data.urgencia) : undefined,
        responsavelTe:
          responsavel?.profile?.nomeCompleto ?? responsavel?.email ?? data.responsavel_te ?? null,
        observacoesInternas: data.observacoes_internas ?? null,
        responsavelId: data.responsavel_id ?? null,
      },
      include: {
        responsavel: {
          include: {
            profile: true,
          },
        },
      },
    });

    return toSolicitacaoRow(updated);
  });

export const deleteSolicitacaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
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