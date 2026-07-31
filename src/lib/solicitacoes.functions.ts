// Tipos de solicitação (form builder) + solicitações.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.local";
import { TipoInput, CampoInput, SolicitacaoInput } from "./conteudo-schemas";

// --------------------------------------------------------------- Tipos (público)

export const listTiposPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("./db.server");
  const { serializeTipo } = await import("./prisma-helpers.server");
  const rows = await prisma.solicitacaoTipo.findMany({
    where: { ativo: true },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });
  return rows.map((t) => serializeTipo(t));
});

export const getTipoBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { prisma } = await import("./db.server");
    const { serializeTipo } = await import("./prisma-helpers.server");
    const tipo = await prisma.solicitacaoTipo.findFirst({
      where: { slug: data.slug, ativo: true },
      include: { campos: { where: { ativo: true }, orderBy: { ordem: "asc" } } },
    });
    return tipo ? serializeTipo(tipo) : null;
  });

// ---------------------------------------------------------------- Tipos (admin)

export const listTiposAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeTipo } = await import("./prisma-helpers.server");
    const rows = await prisma.solicitacaoTipo.findMany({
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      include: { campos: true },
    });
    return rows.map((t) => ({ ...serializeTipo(t), campos_count: t.campos.length }));
  });

export const getTipo = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeTipo } = await import("./prisma-helpers.server");
    const tipo = await prisma.solicitacaoTipo.findUnique({
      where: { id: data.id },
      include: { campos: { orderBy: { ordem: "asc" } } },
    });
    return tipo ? serializeTipo(tipo) : null;
  });

export const saveTipo = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    TipoInput.extend({ id: z.string().uuid().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeTipo } = await import("./prisma-helpers.server");
    const payload = {
      slug: data.slug,
      nome: data.nome,
      descricao: data.descricao ?? null,
      icone: data.icone ?? null,
      cor: data.cor ?? null,
      ativo: data.ativo ?? true,
      ordem: data.ordem ?? 0,
      prazoDias: data.prazo_dias ?? null,
    };
    const row = data.id
      ? await prisma.solicitacaoTipo.update({ where: { id: data.id }, data: payload })
      : await prisma.solicitacaoTipo.create({ data: payload });
    return serializeTipo(row);
  });

export const deleteTipo = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    await prisma.solicitacaoTipo.delete({ where: { id: data.id } });
    return { ok: true };
  });

// ---------------------------------------------------------------------- Campos

export const listCampos = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ tipoId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeCampo } = await import("./prisma-helpers.server");
    const rows = await prisma.solicitacaoCampo.findMany({
      where: { tipoId: data.tipoId },
      orderBy: { ordem: "asc" },
    });
    return rows.map(serializeCampo);
  });

export const saveCampo = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    CampoInput.extend({ tipo_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeCampo } = await import("./prisma-helpers.server");
    const payload = {
      tipoId: data.tipo_id,
      chave: data.chave,
      rotulo: data.rotulo,
      tipoCampo: data.tipo_campo,
      obrigatorio: data.obrigatorio ?? false,
      opcoes: (data.opcoes ?? null) as never,
      placeholder: data.placeholder ?? null,
      ajuda: data.ajuda ?? null,
      ordem: data.ordem ?? 0,
      ativo: data.ativo ?? true,
    };
    const row = data.id
      ? await prisma.solicitacaoCampo.update({ where: { id: data.id }, data: payload })
      : await prisma.solicitacaoCampo.create({ data: payload });
    return serializeCampo(row);
  });

export const deleteCampo = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    await prisma.solicitacaoCampo.delete({ where: { id: data.id } });
    return { ok: true };
  });

export const swapCamposOrdem = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z.object({
      a: z.object({ id: z.string().uuid(), ordem: z.number().int() }),
      b: z.object({ id: z.string().uuid(), ordem: z.number().int() }),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    await prisma.$transaction([
      prisma.solicitacaoCampo.update({ where: { id: data.a.id }, data: { ordem: data.b.ordem } }),
      prisma.solicitacaoCampo.update({ where: { id: data.b.id }, data: { ordem: data.a.ordem } }),
    ]);
    return { ok: true };
  });

// ---------------------------------------------------------------- Solicitações

/** Pública: qualquer pessoa pode abrir uma solicitação. */
export const createSolicitacao = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SolicitacaoInput.parse(data))
  .handler(async ({ data }) => {
    const { prisma } = await import("./db.server");
    const row = await prisma.solicitacao.create({
      data: {
        tipoId: data.tipo_id ?? null,
        unidadeId: data.unidade_id ?? null,
        nomeSolicitante: data.nome_solicitante,
        emailSolicitante: data.email_solicitante,
        unidade: data.unidade,
        segmentoArea: data.segmento_area ?? null,
        cargoFuncao: data.cargo_funcao ?? null,
        tipoSolicitacao: data.tipo_solicitacao,
        titulo: data.titulo,
        descricao: data.descricao,
        publicoImpactado: data.publico_impactado ?? null,
        unidadesImpactadas: data.unidades_impactadas ?? null,
        prazoDesejado: data.prazo_desejado ? new Date(`${data.prazo_desejado}T00:00:00Z`) : null,
        urgencia: data.urgencia ?? "Média",
        linkReferencia: data.link_referencia ?? null,
        observacoesAdicionais: data.observacoes_adicionais ?? null,
        dadosExtras: (data.dados_extras ?? null) as never,
        anexosUrls: (data.anexos_urls ?? null) as never,
        status: "Recebida",
      },
    });
    return { id: row.id };
  });

export const listSolicitacoes = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { assertEquipe } = await import("./authz.server");
    assertEquipe(context);
    const { prisma } = await import("./db.server");
    const { serializeSolicitacao } = await import("./prisma-helpers.server");
    const rows = await prisma.solicitacao.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
    return rows.map((s) => ({ ...serializeSolicitacao(s), responsavel_id: s.responsavelId }));
  });

export const getSolicitacao = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertEquipe } = await import("./authz.server");
    assertEquipe(context);
    const { prisma } = await import("./db.server");
    const { serializeSolicitacao } = await import("./prisma-helpers.server");
    const row = await prisma.solicitacao.findUnique({ where: { id: data.id } });
    if (!row) throw new Error("Solicitação não encontrada.");
    return { ...serializeSolicitacao(row), responsavel_id: row.responsavelId };
  });

export const updateSolicitacao = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.string().trim().max(40),
      responsavel_te: z.string().trim().max(160).nullable().optional(),
      observacoes_internas: z.string().trim().max(5000).nullable().optional(),
      responsavel_id: z.string().uuid().nullable().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertEquipe } = await import("./authz.server");
    assertEquipe(context);
    const { prisma } = await import("./db.server");
    await prisma.solicitacao.update({
      where: { id: data.id },
      data: {
        status: data.status,
        responsavelTe: data.responsavel_te ?? null,
        observacoesInternas: data.observacoes_internas ?? null,
        responsavelId: data.responsavel_id ?? null,
      },
    });
    return { ok: true };
  });

export const deleteSolicitacao = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    await prisma.solicitacao.delete({ where: { id: data.id } });
    return { ok: true };
  });

/** Membros da equipe TE (equipe_te/admin) para atribuição. */
export const listEquipeTE = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { assertEquipe } = await import("./authz.server");
    assertEquipe(context);
    const { prisma } = await import("./db.server");
    const roles = await prisma.userRole.findMany({
      where: { role: { in: ["equipe_te", "admin"] } },
      select: { userId: true },
    });
    const ids = Array.from(new Set(roles.map((r) => r.userId)));
    if (ids.length === 0) return [];
    const profiles = await prisma.profile.findMany({
      where: { id: { in: ids } },
      orderBy: { nomeCompleto: "asc" },
      select: { id: true, nomeCompleto: true },
    });
    return profiles.map((p) => ({ id: p.id, nome_completo: p.nomeCompleto }));
  });