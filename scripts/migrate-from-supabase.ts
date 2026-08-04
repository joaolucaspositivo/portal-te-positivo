// Script de migração de dados do Supabase para Postgres local (Prisma).
// Uso:
//   MIGRATE_SUPABASE_URL=https://xxxx.supabase.co
//   MIGRATE_SUPABASE_SERVICE_ROLE_KEY=xxx
//   DATABASE_URL=postgresql://user:pass@localhost:5432/portalte
//   npx tsx scripts/migrate-from-supabase.ts
//
// O script migra: usuários (auth.users), perfis, papéis, unidades, vínculos,
// tipos de solicitação, campos, solicitações, ferramentas, comunicados, contatos
// e os buckets de Storage `portal-media` e `portal-avatars` para `uploads/`.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = env("MIGRATE_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = env("MIGRATE_SUPABASE_SERVICE_ROLE_KEY");
const DATABASE_URL = env("DATABASE_URL");

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const UPLOADS_DIR = process.env.MIGRATE_UPLOADS_DIR || process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function pick<T>(row: Record<string, any>, keys: string[]): T {
  const out: any = {};
  for (const k of keys) {
    if (row[k] !== undefined) out[k] = row[k];
  }
  return out;
}

function toDate(v: string | null | undefined): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

function log(msg: string) {
  console.log(`[migrate] ${msg}`);
}

async function fetchAll<T = any>(
  supabase: SupabaseClient,
  table: string,
  columns = "*",
): Promise<T[]> {
  const PAGE = 1000;
  let page = 0;
  let all: T[] = [];
  while (true) {
    const { data, error } = await supabase
      .from(table as any)
      .select(columns)
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) throw new Error(`Erro em ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all = all.concat(data as T[]);
    if (data.length < PAGE) break;
    page++;
  }
  return all;
}

async function migrateUsers() {
  log("Buscando usuários do Supabase Auth...");
  // auth.admin.listUsers retorna até 1000 por página; para mais, paginar.
  const users: Array<{
    id: string;
    email?: string;
    email_confirmed_at?: string;
    identities?: Array<{ provider: string; identity_data?: Record<string, any> }>;
  }> = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Erro ao listar auth.users: ${error.message}`);
    if (!data?.users?.length) break;
    users.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }

  log(`Migrando ${users.length} usuários...`);
  for (const u of users) {
    const googleIdentity = u.identities?.find((i) => i.provider === "google");
    const googleId = googleIdentity?.identity_data?.sub as string | undefined;

    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        email: u.email ?? "",
        emailVerifiedAt: toDate(u.email_confirmed_at),
        googleId,
        passwordHash: null,
      },
      update: {
        email: u.email ?? undefined,
        emailVerifiedAt: toDate(u.email_confirmed_at),
        googleId: googleId ?? undefined,
      },
    });
  }
}

async function migrateProfiles() {
  const rows = await fetchAll(supabase, "profiles");
  log(`Migrando ${rows.length} perfis...`);
  for (const r of rows) {
    await prisma.profile.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        nomeCompleto: r.nome_completo ?? null,
        cargo: r.cargo ?? null,
        unidade: r.unidade ?? null,
        telefone: r.telefone ?? null,
        avatarUrl: r.avatar_url ?? null,
        bio: r.bio ?? null,
        status: r.status ?? "pendente",
        createdAt: toDate(r.created_at) ?? new Date(),
        updatedAt: toDate(r.updated_at) ?? new Date(),
      },
      update: {
        nomeCompleto: r.nome_completo ?? null,
        cargo: r.cargo ?? null,
        unidade: r.unidade ?? null,
        telefone: r.telefone ?? null,
        avatarUrl: r.avatar_url ?? null,
        bio: r.bio ?? null,
        status: r.status ?? "pendente",
      },
    });
  }
}

async function migrateUserRoles() {
  const rows = await fetchAll(supabase, "user_roles");
  log(`Migrando ${rows.length} papéis...`);
  for (const r of rows) {
    await prisma.userRole.upsert({
      where: { userId_role: { userId: r.user_id, role: r.role } },
      create: {
        id: r.id,
        userId: r.user_id,
        role: r.role,
        createdAt: toDate(r.created_at) ?? new Date(),
      },
      update: {},
    });
  }
}

async function migrateUnidades() {
  const rows = await fetchAll(supabase, "unidades");
  log(`Migrando ${rows.length} unidades...`);
  for (const r of rows) {
    await prisma.unidade.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        nome: r.nome,
        sigla: r.sigla,
        status: r.status ?? "ativa",
        cep: r.cep ?? null,
        logradouro: r.logradouro ?? null,
        numero: r.numero ?? null,
        complemento: r.complemento ?? null,
        bairro: r.bairro ?? null,
        cidade: r.cidade ?? null,
        estado: r.estado ?? null,
        telefone: r.telefone ?? null,
        email: r.email ?? null,
        responsavelNome: r.responsavel_nome ?? null,
        responsavelCargo: r.responsavel_cargo ?? null,
        createdAt: toDate(r.created_at) ?? new Date(),
        updatedAt: toDate(r.updated_at) ?? new Date(),
      },
      update: {
        nome: r.nome,
        sigla: r.sigla,
        status: r.status ?? "ativa",
        cep: r.cep ?? null,
        logradouro: r.logradouro ?? null,
        numero: r.numero ?? null,
        complemento: r.complemento ?? null,
        bairro: r.bairro ?? null,
        cidade: r.cidade ?? null,
        estado: r.estado ?? null,
        telefone: r.telefone ?? null,
        email: r.email ?? null,
        responsavelNome: r.responsavel_nome ?? null,
        responsavelCargo: r.responsavel_cargo ?? null,
      },
    });
  }
}

async function migrateUsuarioUnidades() {
  const rows = await fetchAll(supabase, "usuario_unidades");
  log(`Migrando ${rows.length} vínculos usuário-unidade...`);
  for (const r of rows) {
    await prisma.usuarioUnidade.upsert({
      where: { userId_unidadeId: { userId: r.user_id, unidadeId: r.unidade_id } },
      create: {
        userId: r.user_id,
        unidadeId: r.unidade_id,
        principal: r.principal ?? false,
        createdAt: toDate(r.created_at) ?? new Date(),
      },
      update: {
        principal: r.principal ?? false,
      },
    });
  }
}

async function migrateSolicitacaoTipos() {
  const rows = await fetchAll(supabase, "solicitacao_tipos");
  log(`Migrando ${rows.length} tipos de solicitação...`);
  for (const r of rows) {
    await prisma.solicitacaoTipo.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        slug: r.slug,
        nome: r.nome,
        descricao: r.descricao ?? null,
        icone: r.icone ?? null,
        cor: r.cor ?? null,
        ativo: r.ativo ?? true,
        ordem: r.ordem ?? 0,
        prazoDias: r.prazo_dias ?? null,
        createdAt: toDate(r.created_at) ?? new Date(),
        updatedAt: toDate(r.updated_at) ?? new Date(),
      },
      update: {
        slug: r.slug,
        nome: r.nome,
        descricao: r.descricao ?? null,
        icone: r.icone ?? null,
        cor: r.cor ?? null,
        ativo: r.ativo ?? true,
        ordem: r.ordem ?? 0,
        prazoDias: r.prazo_dias ?? null,
      },
    });
  }
}

async function migrateSolicitacaoCampos() {
  const rows = await fetchAll(supabase, "solicitacao_campos");
  log(`Migrando ${rows.length} campos de solicitação...`);
  for (const r of rows) {
    await prisma.solicitacaoCampo.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        tipoId: r.tipo_id,
        chave: r.chave,
        rotulo: r.rotulo,
        tipoCampo: r.tipo_campo,
        obrigatorio: r.obrigatorio ?? false,
        opcoes: r.opcoes ?? null,
        placeholder: r.placeholder ?? null,
        ajuda: r.ajuda ?? null,
        ordem: r.ordem ?? 0,
        ativo: r.ativo ?? true,
        createdAt: toDate(r.created_at) ?? new Date(),
        updatedAt: toDate(r.updated_at) ?? new Date(),
      },
      update: {
        tipoId: r.tipo_id,
        chave: r.chave,
        rotulo: r.rotulo,
        tipoCampo: r.tipo_campo,
        obrigatorio: r.obrigatorio ?? false,
        opcoes: r.opcoes ?? null,
        placeholder: r.placeholder ?? null,
        ajuda: r.ajuda ?? null,
        ordem: r.ordem ?? 0,
        ativo: r.ativo ?? true,
      },
    });
  }
}

async function migrateSolicitacoes() {
  const rows = await fetchAll(supabase, "solicitacoes");
  log(`Migrando ${rows.length} solicitações...`);
  for (const r of rows) {
    await prisma.solicitacao.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        tipoId: r.tipo_id ?? null,
        unidadeId: r.unidade_id ?? null,
        nomeSolicitante: r.nome_solicitante,
        emailSolicitante: r.email_solicitante,
        unidade: r.unidade,
        segmentoArea: r.segmento_area ?? null,
        cargoFuncao: r.cargo_funcao ?? null,
        tipoSolicitacao: r.tipo_solicitacao,
        titulo: r.titulo,
        descricao: r.descricao,
        publicoImpactado: r.publico_impactado ?? null,
        unidadesImpactadas: r.unidades_impactadas ?? null,
        prazoDesejado: r.prazo_desejado ? new Date(r.prazo_desejado) : null,
        urgencia: r.urgencia ?? "Média",
        linkReferencia: r.link_referencia ?? null,
        observacoesAdicionais: r.observacoes_adicionais ?? null,
        dadosExtras: r.dados_extras ?? null,
        anexosUrls: r.anexos_urls ?? null,
        status: r.status ?? "Recebida",
        responsavelTe: r.responsavel_te ?? null,
        responsavelId: r.responsavel_id ?? null,
        observacoesInternas: r.observacoes_internas ?? null,
        createdAt: toDate(r.created_at) ?? new Date(),
        updatedAt: toDate(r.updated_at) ?? new Date(),
      },
      update: {
        tipoId: r.tipo_id ?? null,
        unidadeId: r.unidade_id ?? null,
        nomeSolicitante: r.nome_solicitante,
        emailSolicitante: r.email_solicitante,
        unidade: r.unidade,
        segmentoArea: r.segmento_area ?? null,
        cargoFuncao: r.cargo_funcao ?? null,
        tipoSolicitacao: r.tipo_solicitacao,
        titulo: r.titulo,
        descricao: r.descricao,
        publicoImpactado: r.publico_impactado ?? null,
        unidadesImpactadas: r.unidades_impactadas ?? null,
        prazoDesejado: r.prazo_desejado ? new Date(r.prazo_desejado) : null,
        urgencia: r.urgencia ?? "Média",
        linkReferencia: r.link_referencia ?? null,
        observacoesAdicionais: r.observacoes_adicionais ?? null,
        dadosExtras: r.dados_extras ?? null,
        anexosUrls: r.anexos_urls ?? null,
        status: r.status ?? "Recebida",
        responsavelTe: r.responsavel_te ?? null,
        responsavelId: r.responsavel_id ?? null,
        observacoesInternas: r.observacoes_internas ?? null,
      },
    });
  }
}

async function migrateFerramentas() {
  const rows = await fetchAll(supabase, "ferramentas");
  log(`Migrando ${rows.length} ferramentas...`);
  for (const r of rows) {
    await prisma.ferramenta.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        nome: r.nome,
        descricao: r.descricao ?? null,
        categoria: r.categoria ?? null,
        publicoAlvo: r.publico_alvo ?? null,
        segmento: r.segmento ?? null,
        linkAcesso: r.link_acesso ?? null,
        responsavel: r.responsavel ?? null,
        imagemUrl: r.imagem_url ? fixStorageUrl(r.imagem_url) : null,
        status: r.status ?? "Ativa",
        createdAt: toDate(r.created_at) ?? new Date(),
        updatedAt: toDate(r.updated_at) ?? new Date(),
      },
      update: {
        nome: r.nome,
        descricao: r.descricao ?? null,
        categoria: r.categoria ?? null,
        publicoAlvo: r.publico_alvo ?? null,
        segmento: r.segmento ?? null,
        linkAcesso: r.link_acesso ?? null,
        responsavel: r.responsavel ?? null,
        imagemUrl: r.imagem_url ? fixStorageUrl(r.imagem_url) : null,
        status: r.status ?? "Ativa",
      },
    });
  }
}

async function migrateComunicados() {
  const rows = await fetchAll(supabase, "comunicados");
  log(`Migrando ${rows.length} comunicados...`);
  for (const r of rows) {
    await prisma.comunicado.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        titulo: r.titulo,
        resumo: r.resumo ?? null,
        conteudo: r.conteudo,
        categoria: r.categoria ?? null,
        autor: r.autor ?? null,
        imagemUrl: r.imagem_url ? fixStorageUrl(r.imagem_url) : null,
        dataPublicacao: r.data_publicacao ? new Date(r.data_publicacao) : new Date(),
        destaque: r.destaque ?? false,
        publicado: r.publicado ?? true,
        createdAt: toDate(r.created_at) ?? new Date(),
        updatedAt: toDate(r.updated_at) ?? new Date(),
      },
      update: {
        titulo: r.titulo,
        resumo: r.resumo ?? null,
        conteudo: r.conteudo,
        categoria: r.categoria ?? null,
        autor: r.autor ?? null,
        imagemUrl: r.imagem_url ? fixStorageUrl(r.imagem_url) : null,
        dataPublicacao: r.data_publicacao ? new Date(r.data_publicacao) : new Date(),
        destaque: r.destaque ?? false,
        publicado: r.publicado ?? true,
      },
    });
  }
}

async function migrateContatos() {
  const rows = await fetchAll(supabase, "contatos");
  log(`Migrando ${rows.length} contatos...`);
  for (const r of rows) {
    await prisma.contato.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        nome: r.nome,
        funcao: r.funcao ?? null,
        unidade: r.unidade ?? null,
        email: r.email ?? null,
        telefoneWhatsapp: r.telefone_whatsapp ?? null,
        tipoContato: r.tipo_contato ?? null,
        ativo: r.ativo ?? true,
        userId: r.user_id ?? null,
        createdAt: toDate(r.created_at) ?? new Date(),
        updatedAt: toDate(r.updated_at) ?? new Date(),
      },
      update: {
        nome: r.nome,
        funcao: r.funcao ?? null,
        unidade: r.unidade ?? null,
        email: r.email ?? null,
        telefoneWhatsapp: r.telefone_whatsapp ?? null,
        tipoContato: r.tipo_contato ?? null,
        ativo: r.ativo ?? true,
        userId: r.user_id ?? null,
      },
    });
  }
}

// Converte URLs do tipo https://<project>.supabase.co/storage/v1/object/public/portal-media/foo/bar.jpg
// para /api/files/portal-media/foo/bar.jpg (caminho local do servidor).
function fixStorageUrl(url: string): string {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      return `/api/files/${match[1]}/${match[2]}`;
    }
    // fallback: tenta achar /portal-media/ ou /portal-avatars/ na URL
    const fallback = url.match(/\/(portal-media|portal-avatars)\/(.+)$/);
    if (fallback) return `/api/files/${fallback[1]}/${fallback[2]}`;
  } catch {
    // ignore
  }
  return url;
}

async function migrateStorageFiles() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  for (const bucket of ["portal-media", "portal-avatars"]) {
    const bucketDir = path.join(UPLOADS_DIR, bucket);
    await fs.mkdir(bucketDir, { recursive: true });
    const files = await listStorageObjects(supabase, bucket, "");
    log(`Migrando ${files.length} arquivos do bucket "${bucket}"...`);
    for (const name of files) {
      const { data, error } = await supabase.storage.from(bucket).download(name);
      if (error || !data) {
        console.warn(`[migrate] Não foi possível baixar ${bucket}/${name}: ${error?.message ?? "unknown"}`);
        continue;
      }
      const dest = path.join(bucketDir, name);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      const buf = Buffer.from(await data.arrayBuffer());
      await fs.writeFile(dest, buf);
    }
  }
}

async function listStorageObjects(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(`Erro ao listar bucket ${bucket}: ${error.message}`);
  const out: string[] = [];
  for (const item of data ?? []) {
    if (item.id) {
      // item.name pode conter prefixo
      out.push(prefix ? `${prefix}/${item.name}` : item.name);
    } else if (item.name) {
      // pasta: recursivamente lista
      const sub = await listStorageObjects(supabase, bucket, prefix ? `${prefix}/${item.name}` : item.name);
      out.push(...sub);
    }
  }
  return out;
}

async function main() {
  log("Iniciando migração do Supabase para Postgres local...");

  await migrateUsers();
  await migrateProfiles();
  await migrateUserRoles();
  await migrateUnidades();
  await migrateUsuarioUnidades();
  await migrateSolicitacaoTipos();
  await migrateSolicitacaoCampos();
  await migrateSolicitacoes();
  await migrateFerramentas();
  await migrateComunicados();
  await migrateContatos();
  await migrateStorageFiles();

  log("Migração concluída.");
}

main()
  .catch((e) => {
    console.error("[migrate] ERRO:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
