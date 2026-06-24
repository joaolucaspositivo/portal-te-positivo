import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Inbox } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/solicitacoes/")({
  head: () => ({
    meta: [
      { title: "Solicitações — Portal TE" },
      { name: "description", content: "Escolha o tipo de solicitação ou chamado para abrir junto à equipe de Tecnologia Educacional." },
    ],
  }),
  component: SolicitacoesGallery,
});

function SolicitacoesGallery() {
  const { data: tipos = [], isLoading } = useQuery({
    queryKey: ["public-tipos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacao_tipos")
        .select("id, nome, slug, descricao, icone, ordem")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-muted/40 border-b">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold">Solicitações</h1>
            <p className="mt-3 text-muted-foreground max-w-3xl">
              Escolha o tipo de solicitação ou chamado para abrir junto à equipe de Tecnologia Educacional.
              Cada tipo possui um formulário específico e é direcionado ao responsável adequado.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-16">Carregando tipos…</p>
          ) : tipos.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">Nenhum tipo de solicitação disponível no momento.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tipos.map((t: any) => (
                <Link
                  key={t.id}
                  to="/solicitacoes/$slug"
                  params={{ slug: t.slug }}
                  className="group rounded-xl border bg-card p-6 hover:border-primary transition-colors flex flex-col"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <h2 className="font-semibold text-lg group-hover:text-primary">{t.nome}</h2>
                  {t.descricao && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3 flex-1">{t.descricao}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Abrir formulário <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}