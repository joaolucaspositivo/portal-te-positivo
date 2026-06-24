
-- Enum
CREATE TYPE public.unidade_status AS ENUM ('ativa', 'inativa');

-- Tabela unidades
CREATE TABLE public.unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  sigla text NOT NULL UNIQUE,
  status public.unidade_status NOT NULL DEFAULT 'ativa',
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  telefone text,
  email text,
  responsavel_nome text,
  responsavel_cargo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unidades TO authenticated;
GRANT ALL ON public.unidades TO service_role;

ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unidades_select_authenticated"
  ON public.unidades FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "unidades_insert_admin"
  ON public.unidades FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "unidades_update_admin"
  ON public.unidades FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "unidades_delete_admin"
  ON public.unidades FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_unidades_updated_at
  BEFORE UPDATE ON public.unidades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tabela vínculo usuario_unidades
CREATE TABLE public.usuario_unidades (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidade_id uuid NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  principal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, unidade_id)
);

CREATE UNIQUE INDEX usuario_unidades_principal_unico
  ON public.usuario_unidades (user_id) WHERE principal = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuario_unidades TO authenticated;
GRANT ALL ON public.usuario_unidades TO service_role;

ALTER TABLE public.usuario_unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_unidades_select_own_or_admin"
  ON public.usuario_unidades FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "usuario_unidades_insert_admin"
  ON public.usuario_unidades FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "usuario_unidades_update_admin"
  ON public.usuario_unidades FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "usuario_unidades_delete_admin"
  ON public.usuario_unidades FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Função auxiliar
CREATE OR REPLACE FUNCTION public.user_pertence_unidade(_user_id uuid, _unidade_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario_unidades
    WHERE user_id = _user_id AND unidade_id = _unidade_id
  )
$$;

-- Adiciona unidade_id em solicitacoes
ALTER TABLE public.solicitacoes
  ADD COLUMN unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL;

CREATE INDEX solicitacoes_unidade_id_idx ON public.solicitacoes(unidade_id);
