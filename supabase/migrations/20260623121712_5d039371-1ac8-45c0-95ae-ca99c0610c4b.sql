
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;
UPDATE public.user_roles SET role = 'usuario' WHERE role = 'user';
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'equipe_te', 'editor', 'usuario');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins write comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Auth read all comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Admins write contatos" ON public.contatos;
DROP POLICY IF EXISTS "Auth read all contatos" ON public.contatos;
DROP POLICY IF EXISTS "Admins write ferramentas" ON public.ferramentas;
DROP POLICY IF EXISTS "Admins read solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Admins update solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Admins delete solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Public can create solicitacoes validated" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Admins write comunicados" ON public.comunicados FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth read all comunicados" ON public.comunicados FOR SELECT TO authenticated
  USING (publicado = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write contatos" ON public.contatos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth read all contatos" ON public.contatos FOR SELECT TO authenticated
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write ferramentas" ON public.ferramentas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read solicitacoes" ON public.solicitacoes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'equipe_te'));
CREATE POLICY "Admins update solicitacoes" ON public.solicitacoes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'equipe_te'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'equipe_te'));
CREATE POLICY "Admins delete solicitacoes" ON public.solicitacoes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can create solicitacoes validated" ON public.solicitacoes FOR INSERT TO anon, authenticated
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
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- profiles
DROP TYPE IF EXISTS public.profile_status CASCADE;
CREATE TYPE public.profile_status AS ENUM ('pendente', 'ativo', 'bloqueado');

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo text, cargo text, unidade text, telefone text,
  avatar_url text, bio text,
  status public.profile_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Team and admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile (not status)" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Team and admins read all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'equipe_te'));
CREATE POLICY "Users update own profile (not status)" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins manage all profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.profiles_prevent_self_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change profile status';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS profiles_block_self_status ON public.profiles;
CREATE TRIGGER profiles_block_self_status BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_prevent_self_status_change();
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_is_seed boolean := (NEW.email = 'tecipp@colegiopositivo.com.br');
BEGIN
  INSERT INTO public.profiles (id, nome_completo, status)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN v_is_seed THEN 'ativo'::public.profile_status ELSE 'pendente'::public.profile_status END
  ) ON CONFLICT (id) DO NOTHING;
  IF v_is_seed THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'usuario') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, nome_completo, status)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'nome', u.raw_user_meta_data->>'full_name', u.email),
  CASE WHEN u.email = 'tecipp@colegiopositivo.com.br' THEN 'ativo'::public.profile_status
       WHEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin') THEN 'ativo'::public.profile_status
       ELSE 'pendente'::public.profile_status END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'usuario'::public.app_role FROM auth.users u ON CONFLICT DO NOTHING;

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker = false) AS
SELECT id, nome_completo, cargo, unidade, avatar_url
FROM public.profiles WHERE status = 'ativo';
GRANT SELECT ON public.profiles_public TO anon, authenticated;

ALTER TABLE public.contatos
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS contatos_user_id_idx ON public.contatos(user_id);

DROP POLICY IF EXISTS "Avatars read auth" ON storage.objects;
DROP POLICY IF EXISTS "Avatars read anon" ON storage.objects;
DROP POLICY IF EXISTS "Avatars users insert own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars users update own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars users delete own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars admins manage" ON storage.objects;

CREATE POLICY "Avatars read auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'portal-avatars');
CREATE POLICY "Avatars read anon" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'portal-avatars');
CREATE POLICY "Avatars users insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portal-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatars users update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portal-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatars users delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portal-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatars admins manage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'portal-avatars' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'portal-avatars' AND public.has_role(auth.uid(), 'admin'));
