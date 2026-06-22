## 1. Remover card "Registre uma solicitação à TE" do hero

Em `src/routes/index.tsx`, remover o card lateral de reforço de CTA (linhas ~108-129) e ajustar o grid do hero de `lg:grid-cols-[1.3fr_1fr]` para coluna única, para o título e CTA ocuparem o hero por inteiro. O botão "Abrir solicitação" do hero continua sendo o ponto principal de chamada.

## 2. Upload de imagem (capa) em Comunicados e Ferramentas

**Backend (migration):**
- Criar bucket de Storage público `portal-media` com policies: leitura pública (`anon` + `authenticated` SELECT) e escrita restrita a admins (INSERT/UPDATE/DELETE com `has_role(auth.uid(), 'admin')`).
- Adicionar coluna `imagem_url text` em `public.comunicados` e em `public.ferramentas`.

**Admin (forms):**
- Em `area-te.comunicados.tsx` e `area-te.ferramentas.tsx`: novo campo "Imagem de capa" usando um componente reutilizável `ImageUploadField` que faz upload para `portal-media/{table}/{uuid}.{ext}` via `supabase.storage`, mostra preview e botão "Remover". Salva a URL pública em `imagem_url`.

**Exibição pública:**
- Home (`index.tsx`): renderizar `imagem_url` nos cards de comunicados e ferramentas (topo do card, `aspect-video object-cover`).
- `comunicados.tsx` e `ferramentas.tsx`: mostrar a capa no topo de cada card quando existir.

## 3. Editor de texto rico (título, subtítulo, negrito, listas, links)

Adotar **Tiptap** (`@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-link`), que é leve, edge-friendly e salva como HTML.

**Onde aplica:**
- `area-te.comunicados.tsx`: substituir o `<textarea>` do campo **Conteúdo** por um novo componente `RichTextEditor` com toolbar (H1, H2, H3, Negrito, Itálico, Lista, Lista numerada, Link, Citação, Limpar formatação). O campo `resumo` continua como textarea simples (texto curto para preview).
- O HTML produzido é salvo no campo existente `comunicados.conteudo` (text). Não é necessária migração de tipo.
- Em `comunicados.tsx` (público), trocar o `whitespace-pre-wrap` por `dangerouslySetInnerHTML` em um wrapper com classes `prose prose-sm max-w-none` (Tailwind Typography). Como o conteúdo só é gravado por admins autenticados, o risco de XSS de terceiros é nulo, mas vou sanitizar com `DOMPurify` antes da renderização por padrão.

**Ferramentas:** o campo `descricao` continua textarea (descrição curta de catálogo) — rich text aqui adiciona ruído visual. Se você quiser rich text também nas ferramentas, me avise e eu incluo.

## 4. Detalhes técnicos

- Dependências novas: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `dompurify`, `@types/dompurify`, `@tailwindcss/typography`.
- `src/styles.css`: registrar o plugin Typography com `@plugin "@tailwindcss/typography";`.
- Novo arquivo `src/components/rich-text-editor.tsx` (editor + toolbar) e `src/components/image-upload-field.tsx` (upload via Storage).
- Validação: limite de 5 MB por imagem, tipos `image/png|jpeg|webp|gif`.

## 5. O que NÃO muda

- Schema das outras tabelas, RLS existente, autenticação, rotas, e os comunicados/ferramentas já cadastrados (campos novos são opcionais).
