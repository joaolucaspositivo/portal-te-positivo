
-- 1) Contatos: remove anon SELECT on the base table; expose only safe columns via a view
DROP POLICY IF EXISTS "Public read active contatos" ON public.contatos;
REVOKE SELECT ON public.contatos FROM anon;

CREATE OR REPLACE VIEW public.contatos_public
WITH (security_invoker = true) AS
SELECT id, nome, funcao, unidade, tipo_contato, ativo
FROM public.contatos
WHERE ativo = true;

GRANT SELECT ON public.contatos_public TO anon, authenticated;

-- Allow anon to SELECT through the view (view runs as invoker, so base table needs a matching policy)
CREATE POLICY "Anon read active contatos safe cols"
ON public.contatos FOR SELECT TO anon
USING (ativo = true);
-- NOTE: above grants anon SELECT on base table again; instead use a SECURITY DEFINER view pattern:
DROP POLICY "Anon read active contatos safe cols" ON public.contatos;
DROP VIEW public.contatos_public;

CREATE VIEW public.contatos_public
WITH (security_invoker = false) AS
SELECT id, nome, funcao, unidade, tipo_contato
FROM public.contatos
WHERE ativo = true;

ALTER VIEW public.contatos_public OWNER TO postgres;
GRANT SELECT ON public.contatos_public TO anon, authenticated;

-- 2) Solicitacoes: tighten WITH CHECK with field validation
DROP POLICY IF EXISTS "Anyone can create solicitacoes" ON public.solicitacoes;

CREATE POLICY "Public can create solicitacoes validated"
ON public.solicitacoes FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(nome_solicitante) BETWEEN 2 AND 120
  AND char_length(email_solicitante) BETWEEN 5 AND 200
  AND email_solicitante ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND char_length(titulo) BETWEEN 3 AND 200
  AND char_length(descricao) BETWEEN 5 AND 5000
  AND char_length(unidade) BETWEEN 1 AND 120
  AND char_length(tipo_solicitacao) BETWEEN 1 AND 120
  AND status = 'Recebida'
  AND responsavel_te IS NULL
  AND observacoes_internas IS NULL
);

-- 3) has_role: restrict EXECUTE to authenticated only (used inside RLS only)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
