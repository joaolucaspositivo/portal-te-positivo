import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";
import {
  getUrgenciaPeso,
  normalizeSolicitacaoStatus,
  normalizeSolicitacaoUrgencia,
} from "@/lib/solicitacoes.constants";

function assertEquipeTE(ctx: { roles?: string[] }) {
  const roles = ctx.roles ?? [];

  if (!roles.includes("admin") && !roles.includes("equipe_te")) {
    throw new Error("Forbidden");
  }
}

async function getConfigOpcaoNome(
  prisma: any,
  grupo: "status_solicitacao" | "prioridade_solicitacao",
  nome: string | null | undefined,
  fallback: string,
) {
  const valor = nome?.trim();

  if (!valor) {
    const padrao = await prisma.configuracaoOpcao.findFirst({
      where: {
        grupo,
        ativo: true,
        padrao: true,
      },
      orderBy: {
        ordem: "asc",
      },
    });

    return padrao?.nome ?? fallback;
  }

  const opcao = await prisma.configuracaoOpcao.findFirst({
    where: {
      grupo,
      ativo: true,
      nome: valor,
    },
  });

  if (!opcao) {
    throw new Error(`Opção inválida: ${valor}`);
  }

  return opcao.nome;
}

async function getStatusAbertos(prisma: any) {
  const opcoes = await prisma.configuracaoOpcao.findMany({
    where: {
      grupo: "status_solicitacao",
      ativo: true,
    },
  });

  return opcoes
    .filter((opcao: any) => !!opcao.meta?.aberta)
    .map((opcao: any) => opcao.nome);
}

async function getPrioridadePesoMap(prisma: any): Promise<Map<string, number>> {
  const opcoes = await prisma.configuracaoOpcao.findMany({
    where: {
      grupo: "prioridade_solicitacao",
      ativo: true,
    },
  });

  return new Map<string, number>(
    opcoes.map((opcao: any): [string, number] => [
      String(opcao.nome),
      Number(opcao.meta?.peso ?? getUrgenciaPeso(opcao.nome)),
    ]),
  );
}

async function registrarHistoricoSolicitacao(
  prisma: any,
  input: {
    solicitacaoId: string;
    autorId?: string | null;
    tipo: string;
    titulo: string;
    descricao?: string | null;
    valorAnterior?: string | null;
    valorNovo?: string | null;
    metadata?: any;
  },
) {
  try {
    await prisma.solicitacaoHistorico.create({
      data: {
        solicitacaoId: input.solicitacaoId,
        autorId: input.autorId ?? null,
        tipo: input.tipo,
        titulo: input.titulo,
        descricao: input.descricao ?? null,
        valorAnterior: input.valorAnterior ?? null,
        valorNovo: input.valorNovo ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("[solicitacao-historico] Falha ao registrar histórico.", error);
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

function toSolicitacaoRow(
  s: any,
  options?: {
    prioridadePesoMap?: Map<string, number>;
  },
) {
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
    urgencia_peso:
      options?.prioridadePesoMap?.get(s.urgencia) ?? getUrgenciaPeso(s.urgencia),
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

function toHistoricoRow(h: any) {
  return {
    id: h.id,
    solicitacao_id: h.solicitacaoId,
    autor_id: h.autorId,
    autor_nome: h.autor?.profile?.nomeCompleto ?? h.autor?.email ?? null,
    autor_email: h.autor?.email ?? null,
    tipo: h.tipo,
    titulo: h.titulo,
    descricao: h.descricao,
    valor_anterior: h.valorAnterior,
    valor_novo: h.valorNovo,
    metadata: h.metadata,
    created_at: h.createdAt,
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

    const urgencia = await getConfigOpcaoNome(
      prisma,
      "prioridade_solicitacao",
      data.urgencia,
      "",
    );

    const statusInicial = await getConfigOpcaoNome(
      prisma,
      "status_solicitacao",
      null,
      "",
    );

    if (!urgencia) {
      throw new Error("Nenhuma prioridade padrão configurada.");
    }

    if (!statusInicial) {
      throw new Error("Nenhum status inicial padrão configurado.");
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
        urgencia: normalizeSolicitacaoUrgencia(urgencia),
        dadosExtras: data.respostas ?? {},
        status: normalizeSolicitacaoStatus(statusInicial),
      },
      include: {
        responsavel: {
          include: {
            profile: true,
          },
        },
      },
    });

    const row = toSolicitacaoRow(created);

    await registrarHistoricoSolicitacao(prisma, {
      solicitacaoId: created.id,
      autorId: userId,
      tipo: "criacao",
      titulo: "Solicitação criada",
      descricao: `Solicitação aberta por ${created.nomeSolicitante}.`,
      valorNovo: row.status,
      metadata: {
        tipo_solicitacao: row.tipo_solicitacao,
        urgencia: row.urgencia,
        unidade: row.unidade,
      },
    });

    const {
      notifySolicitacaoCriadaSolicitante,
      notifySolicitacaoCriadaEquipe,
    } = await import("./solicitacoes-email.server");

    await Promise.all([
      notifySolicitacaoCriadaSolicitante(row),
      notifySolicitacaoCriadaEquipe(row),
    ]);

    return row;
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
    const ctx = context as { userId?: string; roles?: string[] };
    assertEquipeTE(ctx);

    const { prisma } = await import("./db.server");

    const prioridadePesoMap = await getPrioridadePesoMap(prisma);

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
      const statusAbertos = await getStatusAbertos(prisma);

      if (statusAbertos.length === 0) {
        return [];
      }

      where.status = {
        in: statusAbertos,
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

    const statusAbertos = await getStatusAbertos(prisma);
    const statusAbertosSet = new Set(statusAbertos);

    const rows = solicitacoes.map((s) => toSolicitacaoRow(s, { prioridadePesoMap }));

    return rows.sort((a, b) => {
      const aAberta = statusAbertosSet.has(a.status);
      const bAberta = statusAbertosSet.has(b.status);

      if (aAberta !== bAberta) {
        return aAberta ? -1 : 1;
      }

      const pesoDiff = (b.urgencia_peso ?? 0) - (a.urgencia_peso ?? 0);

      if (pesoDiff !== 0) {
        return pesoDiff;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });

export const getSolicitacaoAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as { userId?: string; roles?: string[] };
    assertEquipeTE(ctx);

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
              in: ["admin", "equipe_te", "editor"],
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
  urgencia: z.string().trim().min(1).max(80).optional(),
  responsavel_te: z.string().trim().max(160).optional().nullable(),
  observacoes_internas: z.string().trim().max(6000).optional().nullable(),
  responsavel_id: z.string().uuid().nullable().optional(),
});

const AddSolicitacaoComentarioSchema = z.object({
  id: z.string().uuid(),
  comentario: z.string().trim().min(1).max(4000),
});

export const updateSolicitacaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => UpdateSolicitacaoSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as { userId?: string; roles?: string[] };
    assertEquipeTE(ctx);

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
                in: ["admin", "equipe_te", "editor"],
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
      throw new Error("Responsável selecionado não está ativo ou não possui papel permitido.");
    }

    const status = await getConfigOpcaoNome(
      prisma,
      "status_solicitacao",
      data.status,
      "",
    );

    if (!status) {
      throw new Error("Status inválido ou não configurado.");
    }

    const urgencia = data.urgencia
      ? await getConfigOpcaoNome(
        prisma,
        "prioridade_solicitacao",
        data.urgencia,
        "",
      )
      : null;

    const before = await prisma.solicitacao.findUnique({
      where: {
        id: data.id,
      },
    });

    const updated = await prisma.solicitacao.update({
      where: {
        id: data.id,
      },
      data: {
        status: normalizeSolicitacaoStatus(status),
        urgencia: urgencia ? normalizeSolicitacaoUrgencia(urgencia) : undefined,
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

    const row = toSolicitacaoRow(updated);

    if (before) {
      const historicos: Promise<void>[] = [];

      const statusAnterior = normalizeSolicitacaoStatus(before.status);
      if (statusAnterior !== row.status) {
        historicos.push(
          registrarHistoricoSolicitacao(prisma, {
            solicitacaoId: row.id,
            autorId: ctx.userId ?? null,
            tipo: "status",
            titulo: "Status alterado",
            descricao: `Status alterado de "${statusAnterior}" para "${row.status}".`,
            valorAnterior: statusAnterior,
            valorNovo: row.status,
          }),
        );
      }

      const urgenciaAnterior = normalizeSolicitacaoUrgencia(before.urgencia);
      if (urgenciaAnterior !== row.urgencia) {
        historicos.push(
          registrarHistoricoSolicitacao(prisma, {
            solicitacaoId: row.id,
            autorId: ctx.userId ?? null,
            tipo: "urgencia",
            titulo: "Urgência alterada",
            descricao: `Urgência alterada de "${urgenciaAnterior}" para "${row.urgencia}".`,
            valorAnterior: urgenciaAnterior,
            valorNovo: row.urgencia,
          }),
        );
      }

      if ((before.responsavelTe ?? "") !== (row.responsavel_te ?? "")) {
        historicos.push(
          registrarHistoricoSolicitacao(prisma, {
            solicitacaoId: row.id,
            autorId: ctx.userId ?? null,
            tipo: "responsavel",
            titulo: "Responsável alterado",
            descricao: `Responsável alterado de "${before.responsavelTe ?? "Não atribuído"}" para "${row.responsavel_te ?? "Não atribuído"}".`,
            valorAnterior: before.responsavelTe ?? null,
            valorNovo: row.responsavel_te ?? null,
          }),
        );
      }

      await Promise.all(historicos);
    }

    if (before && normalizeSolicitacaoStatus(before.status) !== row.status) {
      const { notifySolicitacaoStatusAlterado } = await import("./solicitacoes-email.server");

      await notifySolicitacaoStatusAlterado({
        solicitacao: row,
        statusAnterior: normalizeSolicitacaoStatus(before.status),
        statusNovo: row.status,
      });
    }

    return row;
  });

export const addSolicitacaoComentarioAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => AddSolicitacaoComentarioSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as { userId?: string; roles?: string[] };
    assertEquipeTE(ctx);

    const { prisma } = await import("./db.server");

    const solicitacao = await prisma.solicitacao.findUnique({
      where: {
        id: data.id,
      },
      select: {
        id: true,
      },
    });

    if (!solicitacao) {
      throw new Error("Solicitação não encontrada.");
    }

    await registrarHistoricoSolicitacao(prisma, {
      solicitacaoId: data.id,
      autorId: ctx.userId ?? null,
      tipo: "comentario",
      titulo: "Comentário interno",
      descricao: data.comentario,
    });

    return {
      ok: true,
    };
  });

export const listSolicitacaoHistoricoAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    assertEquipeTE(context as any);

    const { prisma } = await import("./db.server");
    const db = prisma as any;

    const historicos = await db.solicitacaoHistorico.findMany({
      where: {
        solicitacaoId: data.id,
      },
      include: {
        autor: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return historicos.map(toHistoricoRow);
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