## Problema

Você logou com `joao.duarte@colegiopositivo.com.br`, mas a regra automática só promove a admin o e-mail `tecipp@colegiopositivo.com.br`. Por isso `/area-te` mostra "Acesso restrito".

## Solução

Inserir o papel `admin` para `joao.duarte@colegiopositivo.com.br` na tabela `user_roles`, mantendo `tecipp@` também como admin.

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'joao.duarte@colegiopositivo.com.br'
ON CONFLICT DO NOTHING;
```

## Depois disso

1. Saia e entre novamente em `/auth` (para o app reler o papel).
2. Acesse `/area-te` → **Comunicados** para publicar avisos (título, resumo, categoria, destaque, publicado).
3. Acesse `/area-te` → **Ferramentas** para cadastrar plataformas (nome, categoria, descrição, **link de acesso**, status Ativa).
4. Itens marcados como publicados/ativos aparecem automaticamente na home e nas páginas públicas.

Se preferir, posso também já cadastrar alguns comunicados e ferramentas de exemplo para você ver o portal preenchido.