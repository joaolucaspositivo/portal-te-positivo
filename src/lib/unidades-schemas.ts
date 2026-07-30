import { z } from "zod";

export const UnidadeInput = z.object({
  nome: z.string().trim().min(1).max(160),
  sigla: z.string().trim().min(1).max(40),
  status: z.enum(["ativa", "inativa"]).default("ativa"),
  cep: z.string().trim().max(20).nullable().optional(),
  logradouro: z.string().trim().max(200).nullable().optional(),
  numero: z.string().trim().max(20).nullable().optional(),
  complemento: z.string().trim().max(120).nullable().optional(),
  bairro: z.string().trim().max(120).nullable().optional(),
  cidade: z.string().trim().max(120).nullable().optional(),
  estado: z.string().trim().max(2).nullable().optional(),
  telefone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  responsavel_nome: z.string().trim().max(160).nullable().optional(),
  responsavel_cargo: z.string().trim().max(160).nullable().optional(),
});
