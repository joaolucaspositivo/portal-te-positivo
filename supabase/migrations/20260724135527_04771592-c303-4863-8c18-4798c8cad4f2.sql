
-- Contatos: revoke non-safe columns from anon (keep only id, nome, funcao, unidade, tipo_contato, ativo)
REVOKE SELECT (created_at, updated_at, user_id, email, telefone_whatsapp) ON public.contatos FROM anon;

-- Unidades: restrict sensitive columns (email, telefone, responsavel_nome, responsavel_cargo) from authenticated.
-- Only service_role (used by admin server functions) can read them.
REVOKE SELECT ON public.unidades FROM authenticated;
GRANT SELECT (id, nome, sigla, status, cep, logradouro, numero, complemento, bairro, cidade, estado, created_at, updated_at) ON public.unidades TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.unidades TO authenticated;
