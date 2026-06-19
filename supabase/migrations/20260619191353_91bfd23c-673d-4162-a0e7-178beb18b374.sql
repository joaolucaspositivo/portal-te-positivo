
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Solicitacoes
CREATE TABLE public.solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_solicitante TEXT NOT NULL,
  email_solicitante TEXT NOT NULL,
  unidade TEXT NOT NULL,
  segmento_area TEXT,
  cargo_funcao TEXT,
  tipo_solicitacao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  publico_impactado TEXT,
  unidades_impactadas TEXT,
  prazo_desejado DATE,
  urgencia TEXT NOT NULL DEFAULT 'Média',
  link_referencia TEXT,
  observacoes_adicionais TEXT,
  status TEXT NOT NULL DEFAULT 'Recebida',
  responsavel_te TEXT,
  observacoes_internas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes TO authenticated;
GRANT INSERT ON public.solicitacoes TO anon;
GRANT ALL ON public.solicitacoes TO service_role;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create solicitacoes" ON public.solicitacoes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read solicitacoes" ON public.solicitacoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update solicitacoes" ON public.solicitacoes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete solicitacoes" ON public.solicitacoes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_solicitacoes_updated BEFORE UPDATE ON public.solicitacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ferramentas
CREATE TABLE public.ferramentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  publico_alvo TEXT,
  segmento TEXT,
  link_acesso TEXT,
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'Ativa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ferramentas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ferramentas TO authenticated;
GRANT ALL ON public.ferramentas TO service_role;
ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ferramentas" ON public.ferramentas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write ferramentas" ON public.ferramentas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ferramentas_updated BEFORE UPDATE ON public.ferramentas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Comunicados
CREATE TABLE public.comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  resumo TEXT,
  conteudo TEXT NOT NULL,
  categoria TEXT,
  autor TEXT,
  data_publicacao DATE NOT NULL DEFAULT CURRENT_DATE,
  destaque BOOLEAN NOT NULL DEFAULT false,
  publicado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comunicados TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comunicados TO authenticated;
GRANT ALL ON public.comunicados TO service_role;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published comunicados" ON public.comunicados FOR SELECT TO anon USING (publicado = true);
CREATE POLICY "Auth read all comunicados" ON public.comunicados FOR SELECT TO authenticated USING (publicado = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins write comunicados" ON public.comunicados FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_comunicados_updated BEFORE UPDATE ON public.comunicados FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Contatos
CREATE TABLE public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  funcao TEXT,
  unidade TEXT,
  email TEXT,
  telefone_whatsapp TEXT,
  tipo_contato TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contatos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contatos TO authenticated;
GRANT ALL ON public.contatos TO service_role;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active contatos" ON public.contatos FOR SELECT TO anon USING (ativo = true);
CREATE POLICY "Auth read all contatos" ON public.contatos FOR SELECT TO authenticated USING (ativo = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins write contatos" ON public.contatos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_contatos_updated BEFORE UPDATE ON public.contatos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: auto-grant admin to tecipp@colegiopositivo.com.br when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'tecipp@colegiopositivo.com.br' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
