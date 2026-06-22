
-- Add cover image URL to comunicados and ferramentas
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS imagem_url text;
ALTER TABLE public.ferramentas ADD COLUMN IF NOT EXISTS imagem_url text;

-- Storage policies for portal-media bucket
CREATE POLICY "portal-media: anon read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'portal-media');

CREATE POLICY "portal-media: admin insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portal-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "portal-media: admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'portal-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "portal-media: admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portal-media' AND public.has_role(auth.uid(), 'admin'));
