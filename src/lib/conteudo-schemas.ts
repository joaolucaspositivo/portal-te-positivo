// Schemas Zod compartilhados (client-safe).
import { z } from "zod";

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

export const FerramentaInput = z.object({
  nome: z.string().trim().min(1).max(160),
  descricao: nullableText(2000),
  categoria: nullableText(80),
  publico_alvo: nullableText(160),
  segmento: nullableText(160),
  link_acesso: nullableText(500),
  responsavel: nullableText(160),
  imagem_url: nullableText(300),
  status: z.string().trim().max(40).optional(),
});

export const ComunicadoInput = z.object({
  titulo: z.string().trim().min(1).max(200),
  resumo: nullableText(500),
  conteudo: z.string().min(1).max(50000),
  categoria: nullableText(80),
  autor: nullableText(160),
  imagem_url: nullableText(300),
  data_publicacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  destaque: z.boolean().optional(),
  publicado: z.boolean().optional(),
});

export const ContatoInput = z.object({
  nome: z.string().trim().min(1).max(160),
  funcao: nullableText(160),
  unidade: nullableText(160),
  email: z.string().trim().max(160).nullable().optional(),
  telefone_whatsapp: nullableText(40),
  tipo_contato: nullableText(80),
  ativo: z.boolean().optional(),
  user_id: z.string().uuid().nullable().optional(),
});

export const TipoInput = z.object({
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  nome: z.string().trim().min(1).max(160),
  descricao: nullableText(1000),
  icone: nullableText(60),
  cor: nullableText(40),
  ativo: z.boolean().optional(),
  ordem: z.number().int().min(0).max(999).optional(),
  prazo_dias: z.number().int().min(0).max(365).nullable().optional(),
});

export const CampoInput = z.object({
  id: z.string().uuid().optional(),
  chave: z.string().trim().min(1).max(60),
  rotulo: z.string().trim().min(1).max(160),
  tipo_campo: z.string().trim().min(1).max(40),
  obrigatorio: z.boolean().optional(),
  opcoes: z.any().optional(),
  placeholder: nullableText(160),
  ajuda: nullableText(300),
  ordem: z.number().int().min(0).max(999).optional(),
  ativo: z.boolean().optional(),
});

export const SolicitacaoInput = z.object({
  tipo_id: z.string().uuid().nullable().optional(),
  unidade_id: z.string().uuid().nullable().optional(),
  nome_solicitante: z.string().trim().min(2).max(160),
  email_solicitante: z.string().trim().email().max(160),
  unidade: z.string().trim().min(1).max(160),
  segmento_area: nullableText(160),
  cargo_funcao: nullableText(160),
  tipo_solicitacao: z.string().trim().min(1).max(160),
  titulo: z.string().trim().min(3).max(200),
  descricao: z.string().trim().min(5).max(10000),
  publico_impactado: nullableText(300),
  unidades_impactadas: nullableText(300),
  prazo_desejado: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  urgencia: z.string().trim().max(40).optional(),
  link_referencia: nullableText(500),
  observacoes_adicionais: nullableText(2000),
  dados_extras: z.record(z.string(), z.any()).nullable().optional(),
  anexos_urls: z.array(z.string().max(300)).nullable().optional(),
});