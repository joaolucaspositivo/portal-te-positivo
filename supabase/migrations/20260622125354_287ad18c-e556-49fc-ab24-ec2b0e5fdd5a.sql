
-- Replace SECURITY DEFINER view with column-level grants on the base table
DROP VIEW IF EXISTS public.contatos_public;

REVOKE ALL ON public.contatos FROM anon;
GRANT SELECT (id, nome, funcao, unidade, tipo_contato, ativo) ON public.contatos TO anon;

CREATE POLICY "Public read active contatos"
ON public.contatos FOR SELECT TO anon
USING (ativo = true);
