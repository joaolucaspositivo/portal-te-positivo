import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Send,
  Wrench,
  Megaphone,
  Users,
  Info,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal TE — Tecnologia Educacional · Colégio Positivo" },
      {
        name: "description",
        content:
          "Central de informações, ferramentas, comunicados, contatos e solicitações da TE.",
      },
    ],
  }),
  component: Index,
});

const quickCards = [
  { to: "/solicitacoes", title: "Abrir uma solicitação", desc: "Registre projetos, melhorias e correções.", icon: Send },
  { to: "/ferramentas", title: "Conhecer ferramentas", desc: "Catálogo de soluções educacionais.", icon: Wrench },
  { to: "/comunicados", title: "Comunicados da TE", desc: "Avisos e atualizações oficiais.", icon: Megaphone },
  { to: "/contatos", title: "Encontrar contatos", desc: "Equipe central e pontas nas unidades.", icon: Users },
  { to: "/sobre", title: "Entender o que a TE faz", desc: "Atuação e formas de apoio.", icon: Info },
] as const;

function Index() {
  const { data: comunicados } = useQuery({
    queryKey: ["home-comunicados"],
    queryFn: async () => {
      const { data } = await supabase
        .from("comunicados")
        .select("*")
        .eq("publicado", true)
        .order("data_publicacao", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });
  const { data: ferramentas } = useQuery({
    queryKey: ["home-ferramentas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ferramentas")
        .select("*")
        .eq("status", "Ativa")
        .order("nome")
        .limit(4);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground to-foreground/90 text-background">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />
          <div className="container mx-auto px-4 py-20 md:py-28 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/10 text-xs font-medium mb-6">
              <Sparkles className="h-3 w-3" /> Tecnologia Educacional
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
              Portal da Tecnologia Educacional
            </h1>
            <p className="mt-5 text-lg md:text-xl text-background/80 max-w-2xl">
              Central de informações, ferramentas, comunicados, contatos e
              solicitações da TE.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/solicitacoes"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 transition"
              >
                <Send className="h-4 w-4" /> Abrir solicitação
              </Link>
              <Link
                to="/ferramentas"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-background/10 border border-background/20 text-background font-semibold hover:bg-background/20 transition"
              >
                Conhecer ferramentas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Quick access */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-2">Acesso rápido</h2>
          <p className="text-muted-foreground mb-8">Vá direto ao que você precisa.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickCards.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="group p-6 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold mb-1">{c.title}</div>
                <div className="text-sm text-muted-foreground">{c.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Comunicados */}
        <section className="bg-muted/40 py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Comunicados recentes</h2>
                <p className="text-muted-foreground">Atualizações da equipe TE.</p>
              </div>
              <Link
                to="/comunicados"
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver todos →
              </Link>
            </div>
            {comunicados && comunicados.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {comunicados.map((c) => (
                  <div key={c.id} className="p-6 rounded-xl bg-card border">
                    {c.destaque && (
                      <span className="inline-block px-2 py-0.5 mb-2 text-xs font-semibold rounded bg-secondary text-secondary-foreground">
                        Destaque
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground mb-2">
                      {c.categoria} ·{" "}
                      {new Date(c.data_publicacao).toLocaleDateString("pt-BR")}
                    </div>
                    <h3 className="font-semibold mb-1">{c.titulo}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {c.resumo}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum comunicado publicado ainda.
              </p>
            )}
          </div>
        </section>

        {/* Ferramentas destaque */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Ferramentas em destaque</h2>
              <p className="text-muted-foreground">Soluções acompanhadas pela TE.</p>
            </div>
            <Link
              to="/ferramentas"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver catálogo →
            </Link>
          </div>
          {ferramentas && ferramentas.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ferramentas.map((f) => (
                <div key={f.id} className="p-5 rounded-xl border bg-card">
                  <div className="text-xs text-muted-foreground mb-1">{f.categoria}</div>
                  <div className="font-semibold mb-2">{f.nome}</div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {f.descricao}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma ferramenta cadastrada ainda.
            </p>
          )}
        </section>

        {/* CTA final */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-3">Tem uma demanda para a TE?</h2>
            <p className="text-primary-foreground/90 mb-6">
              Registre sua solicitação e nossa equipe fará a análise conforme priorização interna.
            </p>
            <Link
              to="/solicitacoes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-background text-foreground font-semibold hover:bg-background/90 transition"
            >
              <Send className="h-4 w-4" /> Abrir solicitação
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
