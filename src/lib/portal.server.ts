// Resolução do portal (multi-setor). Apenas server-side.
import { prisma } from "./db.server";

export const DEFAULT_PORTAL_SLUG = "te";

export type PortalResolvido = {
  id: string;
  slug: string;
  nome: string;
  sigla: string;
  descricao: string | null;
  status: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  email_contato: string | null;
};

function serialize(p: {
  id: string; slug: string; nome: string; sigla: string; descricao: string | null;
  status: string; logoUrl: string | null; corPrimaria: string | null;
  corSecundaria: string | null; emailContato: string | null;
}): PortalResolvido {
  return {
    id: p.id,
    slug: p.slug,
    nome: p.nome,
    sigla: p.sigla,
    descricao: p.descricao,
    status: p.status,
    logo_url: p.logoUrl,
    cor_primaria: p.corPrimaria,
    cor_secundaria: p.corSecundaria,
    email_contato: p.emailContato,
  };
}

/** Busca um portal pelo slug. Retorna null se não existir. */
export async function getPortalBySlug(slug: string): Promise<PortalResolvido | null> {
  const p = await prisma.portal.findUnique({ where: { slug } });
  return p ? serialize(p) : null;
}

/** Resolve o portal do contexto; lança se não existir ou estiver inativo. */
export async function requirePortal(slug?: string | null): Promise<PortalResolvido> {
  const target = (slug ?? DEFAULT_PORTAL_SLUG).trim().toLowerCase();
  const portal = await getPortalBySlug(target);
  if (!portal) throw new Error(`Portal "${target}" não encontrado.`);
  if (portal.status === "inativo" || portal.status === "recusado") {
    throw new Error(`Portal "${target}" indisponível.`);
  }
  return portal;
}

/** Atalho: só o id do portal, para filtros e gravações. */
export async function requirePortalId(slug?: string | null): Promise<string> {
  return (await requirePortal(slug)).id;
}

/** Lista os portais visíveis na vitrine da plataforma. */
export async function listPortaisAtivos(): Promise<PortalResolvido[]> {
  const rows = await prisma.portal.findMany({
    where: { status: "ativo" },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });
  return rows.map(serialize);
}
