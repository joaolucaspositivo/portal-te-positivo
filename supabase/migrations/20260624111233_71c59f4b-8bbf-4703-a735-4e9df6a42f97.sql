
GRANT SELECT ON public.solicitacao_tipos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacao_tipos TO authenticated;
GRANT ALL ON public.solicitacao_tipos TO service_role;

GRANT SELECT ON public.solicitacao_campos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacao_campos TO authenticated;
GRANT ALL ON public.solicitacao_campos TO service_role;

GRANT INSERT ON public.solicitacoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes TO authenticated;
GRANT ALL ON public.solicitacoes TO service_role;
