// Helpers de serialização Prisma → DTO snake_case pra bater com o formato antigo (Supabase).
import type { Profile, User, Unidade, Solicitacao, SolicitacaoTipo, SolicitacaoCampo, Ferramenta, Comunicado, Contato, UserRole } from "@prisma/client";

export function serializeProfile(p: Profile | null) {
  if (!p) return null;
  return {
    id: p.id,
    nome_completo: p.nomeCompleto,
    cargo: p.cargo,
    unidade: p.unidade,
    telefone: p.telefone,
    avatar_url: p.avatarUrl,
    bio: p.bio,
    status: p.status,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

export function serializeUser(
  u: User & { profile: Profile | null; roles: UserRole[] },
) {
  return {
    id: u.id,
    email: u.email,
    created_at: u.createdAt.toISOString(),
    last_sign_in_at: null as string | null,
    profile: serializeProfile(u.profile),
    roles: u.roles.map((r) => r.role),
  };
}

export function serializeUnidade(u: Unidade) {
  return {
    id: u.id,
    nome: u.nome,
    sigla: u.sigla,
    status: u.status,
    cep: u.cep,
    logradouro: u.logradouro,
    numero: u.numero,
    complemento: u.complemento,
    bairro: u.bairro,
    cidade: u.cidade,
    estado: u.estado,
    telefone: u.telefone,
    email: u.email,
    responsavel_nome: u.responsavelNome,
    responsavel_cargo: u.responsavelCargo,
    created_at: u.createdAt.toISOString(),
    updated_at: u.updatedAt.toISOString(),
  };
}

export function serializeSolicitacao(s: Solicitacao) {
  return {
    id: s.id,
    tipo_id: s.tipoId,
    unidade_id: s.unidadeId,
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
    prazo_desejado: s.prazoDesejado ? s.prazoDesejado.toISOString().slice(0, 10) : null,
    urgencia: s.urgencia,
    link_referencia: s.linkReferencia,
    observacoes_adicionais: s.observacoesAdicionais,
    dados_extras: s.dadosExtras,
    anexos_urls: s.anexosUrls,
    status: s.status,
    responsavel_te: s.responsavelTe,
    observacoes_internas: s.observacoesInternas,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  };
}

export function serializeTipo(t: SolicitacaoTipo & { campos?: SolicitacaoCampo[] }) {
  return {
    id: t.id,
    slug: t.slug,
    nome: t.nome,
    descricao: t.descricao,
    icone: t.icone,
    cor: t.cor,
    ativo: t.ativo,
    ordem: t.ordem,
    prazo_dias: t.prazoDias,
    campos: (t.campos ?? []).map(serializeCampo),
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  };
}

export function serializeCampo(c: SolicitacaoCampo) {
  return {
    id: c.id,
    tipo_id: c.tipoId,
    chave: c.chave,
    rotulo: c.rotulo,
    tipo_campo: c.tipoCampo,
    obrigatorio: c.obrigatorio,
    opcoes: c.opcoes,
    placeholder: c.placeholder,
    ajuda: c.ajuda,
    ordem: c.ordem,
    ativo: c.ativo,
  };
}

export function serializeFerramenta(f: Ferramenta) {
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
    created_at: f.createdAt.toISOString(),
    updated_at: f.updatedAt.toISOString(),
  };
}

export function serializeComunicado(c: Comunicado) {
  return {
    id: c.id,
    titulo: c.titulo,
    resumo: c.resumo,
    conteudo: c.conteudo,
    categoria: c.categoria,
    autor: c.autor,
    imagem_url: c.imagemUrl,
    data_publicacao: c.dataPublicacao.toISOString().slice(0, 10),
    destaque: c.destaque,
    publicado: c.publicado,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  };
}

export function serializeContato(c: Contato) {
  return {
    id: c.id,
    nome: c.nome,
    funcao: c.funcao,
    unidade: c.unidade,
    email: c.email,
    telefone_whatsapp: c.telefoneWhatsapp,
    tipo_contato: c.tipoContato,
    ativo: c.ativo,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  };
}