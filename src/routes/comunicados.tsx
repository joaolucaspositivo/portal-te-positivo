import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Star } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CATEGORIAS_COMUNICADO } from "@/lib/portal-constants";
import { StorageImage } from "@/components/storage-image";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { listComunicadosPublic } from "@/lib/conteudo.functions";

export const Route = createFileRoute("/comunicados")({
  head: () => ({
    meta: [
      { title: "Comunicados — Portal TE" },
      { name: "description", content: "Comunicados oficiais da Tecnologia Educacional." },
    ],
  }),
  component: Comunicados,
});

function Comunicados() {
  const [cat, setCat] = useState("");

  const listComunicadosFn = useServerFn(listComunicadosPublic);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["comunicados-public"],
    queryFn: () => listComunicadosFn(),
  });

  const filtered = items.filter((c: any) => (cat ? c.categoria === cat : true));

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-muted/40 border-b">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold">Comunicados</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Avisos, atualizações e orientações oficiais da Tecnologia Educacional.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <div className="mb-6 max-w-xs">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background"
            >
              <option value="">Todas categorias</option>
              {CATEGORIAS_COMUNICADO.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p>Carregando…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border rounded-xl bg-card">
              <p className="text-muted-foreground">Nenhum comunicado publicado.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((c: any) => (
                <article
                  key={c.id}
                  className={`p-6 rounded-xl border bg-card ${
                    c.destaque ? "border-primary border-2" : ""
                  }`}
                >
                  {c.imagem_url && (
                    <StorageImage
                      path={c.imagem_url}
                      alt={c.titulo}
                      className="w-full aspect-video object-cover rounded-md mb-4"
                    />
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {c.categoria}
                    </span>

                    {c.destaque && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <Star className="h-3 w-3 fill-current" /> Destaque
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold mb-1">{c.titulo}</h2>

                  <div className="text-xs text-muted-foreground mb-3">
                    {new Date(c.data_publicacao).toLocaleDateString("pt-BR")}
                    {c.autor && ` · ${c.autor}`}
                  </div>

                  {c.resumo && <p className="text-sm text-muted-foreground mb-3">{c.resumo}</p>}

                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-primary">
                      Ler na íntegra
                    </summary>
                    <div
                      className="mt-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.conteudo ?? "") }}
                    />
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}