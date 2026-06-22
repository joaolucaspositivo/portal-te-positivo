import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIAS_FERRAMENTA, STATUS_FERRAMENTA, statusColor } from "@/lib/portal-constants";
import { StorageImage } from "@/components/storage-image";

export const Route = createFileRoute("/ferramentas")({
  head: () => ({
    meta: [
      { title: "Ferramentas — Portal TE" },
      { name: "description", content: "Catálogo de ferramentas acompanhadas pela TE." },
    ],
  }),
  component: Ferramentas,
});

function Ferramentas() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [st, setSt] = useState("");
  const { data: ferramentas = [], isLoading } = useQuery({
    queryKey: ["ferramentas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ferramentas").select("*").order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
  const filtered = ferramentas.filter((f: any) => {
    if (q && !f.nome.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && f.categoria !== cat) return false;
    if (st && f.status !== st) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-muted/40 border-b">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold">Ferramentas</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Esta área reúne ferramentas, sistemas e soluções acompanhadas ou indicadas pela
              Tecnologia Educacional.
            </p>
          </div>
        </section>
        <section className="container mx-auto px-4 py-8">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px_200px] mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome…"
                     className="w-full pl-9 pr-3 py-2 rounded-md border bg-background" />
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="px-3 py-2 rounded-md border bg-background">
              <option value="">Todas categorias</option>
              {CATEGORIAS_FERRAMENTA.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={st} onChange={(e) => setSt(e.target.value)} className="px-3 py-2 rounded-md border bg-background">
              <option value="">Todos status</option>
              {STATUS_FERRAMENTA.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border rounded-xl bg-card">
              <p className="text-muted-foreground">Nenhuma ferramenta encontrada.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((f: any) => (
                <div key={f.id} className="p-6 rounded-xl border bg-card flex flex-col">
                  {f.imagem_url && (
                    <StorageImage
                      path={f.imagem_url}
                      alt={f.nome}
                      className="w-full aspect-video object-cover rounded-md mb-3 -mt-2"
                    />
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">{f.categoria}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor(f.status)}`}>
                      {f.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.nome}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{f.descricao}</p>
                  <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    {f.publico_alvo && <div><b className="text-foreground">Público:</b> {f.publico_alvo}</div>}
                    {f.segmento && <div><b className="text-foreground">Segmento:</b> {f.segmento}</div>}
                    {f.responsavel && <div><b className="text-foreground">Responsável:</b> {f.responsavel}</div>}
                  </div>
                  {f.link_acesso && (
                    <a href={f.link_acesso} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      Acessar <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}