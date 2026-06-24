
-- 1) Recreate profiles_public as a SECURITY INVOKER view
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT id, nome_completo, cargo, unidade, avatar_url
FROM public.profiles
WHERE status = 'ativo'::public.profile_status;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2) has_role -> SECURITY INVOKER (callers already have SELECT on user_roles where needed)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Ensure authenticated can call has_role (used in RLS); revoke from anon/public
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3) Trigger-only SECURITY DEFINER functions: revoke direct EXECUTE
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_prevent_self_status_change() FROM PUBLIC, anon, authenticated;

-- 4) contatos: restrict anon column access so email/phone are not readable by anonymous users
REVOKE ALL ON public.contatos FROM anon;
GRANT SELECT (id, nome, funcao, unidade, tipo_contato, user_id, ativo, created_at, updated_at)
  ON public.contatos TO anon;

-- Make sure authenticated still has full row access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contatos TO authenticated;
GRANT ALL ON public.contatos TO service_role;

-- 5) portal-media storage policies: explicit admin/editor writes
DROP POLICY IF EXISTS "portal-media: editors insert" ON storage.objects;
DROP POLICY IF EXISTS "portal-media: editors update" ON storage.objects;
DROP POLICY IF EXISTS "portal-media: editors delete" ON storage.objects;

CREATE POLICY "portal-media: editors insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'portal-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'equipe_te'))
);

CREATE POLICY "portal-media: editors update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'portal-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'equipe_te'))
)
WITH CHECK (
  bucket_id = 'portal-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'equipe_te'))
);

CREATE POLICY "portal-media: editors delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'portal-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'equipe_te'))
);
