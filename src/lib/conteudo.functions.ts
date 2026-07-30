// Ferramentas, comunicados e contatos — leitura pública + CRUD para editores.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.local";
import {
  FerramentaInput,
  ComunicadoInput,
  ContatoInput,
} from "./conteudo-schemas";

// ---------------------------------------------------------------- Ferramentas

export const listFerramentasPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("./db.server");
  const { serializeFerramenta } = await import("./prisma-helpers.server");
  const rows = await prisma.ferramenta.findMany({ orderBy: { nome: "asc" } });
  return rows.map(serializeFerramenta);
});

export const saveFerramenta = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    FerramentaInput.extend({ id: z.string().uuid().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertEditor } = await import("./authz.server");
    assertEditor(context);
    const { prisma } = await import("./db.server");
    const { serializeFerramenta } = await import("./prisma-helpers.server");
    const payload = {
      nome: data.nome,
      descricao: data.descricao ?? null,
      categoria: data.categoria ?? null,
      publicoAlvo: data.publico_alvo ?? null,
      segmento: data.segmento ?? null,
      linkAcesso: data.link_acesso ?? null,
      responsavel: data.responsavel ?? null,
      imagemUrl: data.imagem_url ?? null,
      status: data.status ?? "Ativa",
    };
    const row = data.id
      ? await prisma.ferramenta.update({ where: { id: data.id }, data: payload })
      : await prisma.ferramenta.create({ data: payload });
    return serializeFerramenta(row);
  });

export const deleteFerramenta = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertEditor } = await import("./authz.server");
    assertEditor(context);
    const { prisma } = await import("./db.server");
    await prisma.ferramenta.delete({ where: { id: data.id } });
    return { ok: true };
  });

// ---------------------------------------------------------------- Comunicados

export const listComunicadosPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("./db.server");
  const { serializeComunicado } = await import("./prisma-helpers.server");
  const rows = await prisma.comunicado.findMany({
    where: { publicado: true },
    orderBy: { dataPublicacao: "desc" },
  });
  return rows.map(serializeComunicado);
});

export const listComunicadosAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { assertEditor } = await import("./authz.server");
    assertEditor(context);
    const { prisma } = await import("./db.server");
    const { serializeComunicado } = await import("./prisma-helpers.server");
    const rows = await prisma.comunicado.findMany({ orderBy: { dataPublicacao: "desc" } });
    return rows.map(serializeComunicado);
  });

export const saveComunicado = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    ComunicadoInput.extend({ id: z.string().uuid().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertEditor } = await import("./authz.server");
    assertEditor(context);
    const { prisma } = await import("./db.server");
    const { serializeComunicado } = await import("./prisma-helpers.server");
    const payload = {
      titulo: data.titulo,
      resumo: data.resumo ?? null,
      conteudo: data.conteudo,
      categoria: data.categoria ?? null,
      autor: data.autor ?? null,
      imagemUrl: data.imagem_url ?? null,
      dataPublicacao: new Date(`${data.data_publicacao ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`),
      destaque: data.destaque ?? false,
      publicado: data.publicado ?? true,
    };
    const row = data.id
      ? await prisma.comunicado.update({ where: { id: data.id }, data: payload })
      : await prisma.comunicado.create({ data: payload });
    return serializeComunicado(row);
  });

export const deleteComunicado = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertEditor } = await import("./authz.server");
    assertEditor(context);
    const { prisma } = await import("./db.server");
    await prisma.comunicado.delete({ where: { id: data.id } });
    return { ok: true };
  });

// ------------------------------------------------------------------- Contatos

/** Público: e-mail e telefone só aparecem para usuários autenticados. */
export const listContatosPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("./db.server");
  const { optionalUser } = await import("./authz.server");
  const me = await optionalUser();
  const rows = await prisma.contato.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
  const userIds = rows.map((c) => c.userId).filter(Boolean) as string[];
  const profiles = userIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: userIds } },
        select: { id: true, avatarUrl: true },
      })
    : [];
  const avatars = new Map(profiles.map((p) => [p.id, p.avatarUrl]));
  return rows.map((c) => ({
    id: c.id,
    nome: c.nome,
    funcao: c.funcao,
    unidade: c.unidade,
    tipo_contato: c.tipoContato,
    user_id: c.userId,
    avatar_url: c.userId ? avatars.get(c.userId) ?? null : null,
    email: me ? c.email : null,
    telefone_whatsapp: me ? c.telefoneWhatsapp : null,
  }));
});

export const listContatosAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { assertEditor } = await import("./authz.server");
    assertEditor(context);
    const { prisma } = await import("./db.server");
    const { serializeContato } = await import("./prisma-helpers.server");
    const rows = await prisma.contato.findMany({ orderBy: { nome: "asc" } });
    return rows.map((c) => ({ ...serializeContato(c), user_id: c.userId }));
  });

export const saveContato = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    ContatoInput.extend({ id: z.string().uuid().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertEditor } = await import("./authz.server");
    assertEditor(context);
    const { prisma } = await import("./db.server");
    const { serializeContato } = await import("./prisma-helpers.server");
    const payload = {
      nome: data.nome,
      funcao: data.funcao ?? null,
      unidade: data.unidade ?? null,
      email: data.email ? data.email : null,
      telefoneWhatsapp: data.telefone_whatsapp ?? null,
      tipoContato: data.tipo_contato ?? null,
      ativo: data.ativo ?? true,
      userId: data.user_id ?? null,
    };
    const row = data.id
      ? await prisma.contato.update({ where: { id: data.id }, data: payload })
      : await prisma.contato.create({ data: payload });
    return serializeContato(row);
  });

export const deleteContato = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertEditor } = await import("./authz.server");
    assertEditor(context);
    const { prisma } = await import("./db.server");
    await prisma.contato.delete({ where: { id: data.id } });
    return { ok: true };
  });

/** Perfis ativos — usado para vincular contato a um usuário do sistema. */
export const listProfileOptions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { assertEditor } = await import("./authz.server");
    assertEditor(context);
    const { prisma } = await import("./db.server");
    const rows = await prisma.profile.findMany({
      where: { status: "ativo" },
      orderBy: { nomeCompleto: "asc" },
      select: { id: true, nomeCompleto: true, cargo: true, unidade: true, avatarUrl: true },
    });
    return rows.map((p) => ({
      id: p.id,
      nome_completo: p.nomeCompleto,
      cargo: p.cargo,
      unidade: p.unidade,
      avatar_url: p.avatarUrl,
    }));
  });