
-- =========================================
-- solicitacao_tipos
-- =========================================
CREATE TABLE public.solicitacao_tipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  icone text,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  permite_anonimo boolean NOT NULL DEFAULT true,
  responsavel_padrao_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.solicitacao_tipos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.solicitacao_tipos TO authenticated;
GRANT ALL ON public.solicitacao_tipos TO service_role;
ALTER TABLE public.solicitacao_tipos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tipos public read ativos" ON public.solicitacao_tipos FOR SELECT TO anon
  USING (ativo = true);
CREATE POLICY "Tipos auth read all" ON public.solicitacao_tipos FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Tipos admin write" ON public.solicitacao_tipos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER solicitacao_tipos_set_updated_at BEFORE UPDATE ON public.solicitacao_tipos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- solicitacao_campos
-- =========================================
CREATE TYPE public.campo_tipo AS ENUM (
  'text','textarea','email','url','number','date','select','multiselect','checkbox'
);

CREATE TABLE public.solicitacao_campos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_id uuid NOT NULL REFERENCES public.solicitacao_tipos(id) ON DELETE CASCADE,
  chave text NOT NULL,
  label text NOT NULL,
  tipo_campo public.campo_tipo NOT NULL DEFAULT 'text',
  obrigatorio boolean NOT NULL DEFAULT false,
  opcoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  placeholder text,
  help_text text,
  ordem int NOT NULL DEFAULT 0,
  validacao jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo_id, chave)
);
GRANT SELECT ON public.solicitacao_campos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.solicitacao_campos TO authenticated;
GRANT ALL ON public.solicitacao_campos TO service_role;
ALTER TABLE public.solicitacao_campos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campos public read" ON public.solicitacao_campos FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.solicitacao_tipos t WHERE t.id = tipo_id AND (t.ativo OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Campos admin write" ON public.solicitacao_campos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER solicitacao_campos_set_updated_at BEFORE UPDATE ON public.solicitacao_campos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX solicitacao_campos_tipo_idx ON public.solicitacao_campos(tipo_id, ordem);

-- =========================================
-- Extend solicitacoes
-- =========================================
ALTER TABLE public.solicitacoes
  ADD COLUMN tipo_id uuid REFERENCES public.solicitacao_tipos(id) ON DELETE SET NULL,
  ADD COLUMN solicitante_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN responsavel_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN respostas jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill: create "Geral" tipo and assign all existing solicitacoes
INSERT INTO public.solicitacao_tipos (nome, slug, descricao, icone, ordem, permite_anonimo)
VALUES ('Geral', 'geral', 'Solicitação geral para a equipe TE', 'inbox', 0, true);

UPDATE public.solicitacoes SET tipo_id = (SELECT id FROM public.solicitacao_tipos WHERE slug = 'geral')
WHERE tipo_id IS NULL;

-- Default base fields for "Geral" tipo (matches current static form)
INSERT INTO public.solicitacao_campos (tipo_id, chave, label, tipo_campo, obrigatorio, ordem, opcoes, placeholder)
SELECT t.id, c.chave, c.label, c.tipo_campo::public.campo_tipo, c.obrigatorio, c.ordem,
       c.opcoes::jsonb, c.placeholder
FROM public.solicitacao_tipos t,
(VALUES
  ('publico_impactado','Público impactado','text', false, 1, '[]', NULL),
  ('unidades_impactadas','Unidade(s) impactada(s)','text', false, 2, '[]', NULL),
  ('prazo_desejado','Prazo desejado','date', false, 3, '[]', NULL),
  ('link_referencia','Link de referência','url', false, 4, '[]', 'https://…'),
  ('observacoes_adicionais','Observações adicionais','textarea', false, 5, '[]', NULL)
) AS c(chave, label, tipo_campo, obrigatorio, ordem, opcoes, placeholder)
WHERE t.slug = 'geral';

-- Update INSERT policy to allow either anon (when tipo permits) or authenticated, validating tipo
DROP POLICY IF EXISTS "Public can create solicitacoes validated" ON public.solicitacoes;
CREATE POLICY "Create solicitacoes validated" ON public.solicitacoes FOR INSERT TO anon, authenticated
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
    AND responsavel_id IS NULL
    AND (
      auth.uid() IS NOT NULL AND solicitante_id = auth.uid()
      OR (auth.uid() IS NULL AND solicitante_id IS NULL
          AND tipo_id IS NOT NULL
          AND EXISTS (SELECT 1 FROM public.solicitacao_tipos t WHERE t.id = tipo_id AND t.ativo AND t.permite_anonimo))
    )
  );

-- Add SELECT policy for own solicitacoes (solicitante or responsavel)
DROP POLICY IF EXISTS "Users read own solicitacoes" ON public.solicitacoes;
CREATE POLICY "Users read own solicitacoes" ON public.solicitacoes FOR SELECT TO authenticated
  USING (solicitante_id = auth.uid() OR responsavel_id = auth.uid());

CREATE INDEX solicitacoes_tipo_idx ON public.solicitacoes(tipo_id);
CREATE INDEX solicitacoes_responsavel_idx ON public.solicitacoes(responsavel_id);
CREATE INDEX solicitacoes_solicitante_idx ON public.solicitacoes(solicitante_id);
