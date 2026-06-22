import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Send,
  Wrench,
  Megaphone,
  Users,
  Info,
  ArrowRight,
  GraduationCap,
  Headphones,
  Lightbulb,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { StorageImage } from "@/components/storage-image";

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
  { to: "/ferramentas", title: "Ferramentas", desc: "Catálogo de plataformas e soluções educacionais.", icon: Wrench },
  { to: "/comunicados", title: "Comunicados", desc: "Avisos, atualizações e novidades da TE.", icon: Megaphone },
  { to: "/contatos", title: "Contatos", desc: "Equipe central e referências nas unidades.", icon: Users },
  { to: "/sobre", title: "Sobre a TE", desc: "Quem somos e como atuamos no Positivo.", icon: Info },
] as const;

const teRoles = [
  { icon: GraduationCap, title: "Apoio pedagógico", desc: "Integração de tecnologia às práticas de sala de aula." },
  { icon: Lightbulb, title: "Inovação", desc: "Avaliação e curadoria de novas plataformas e recursos." },
  { icon: Headphones, title: "Suporte às unidades", desc: "Atendimento a coordenações, professores e equipes." },
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
        <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground to-foreground/95 text-background">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/10 text-xs font-medium mb-5 uppercase tracking-wider">
                  Portal TE · Colégio Positivo
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Tecnologia Educacional, num só lugar.
                </h1>
                <p className="mt-4 text-base md:text-lg text-background/80 max-w-xl">
                  Ferramentas, comunicados, contatos e solicitações da TE — para
                  professores, coordenações e unidades.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
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
                    Ver ferramentas <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
            </div>
          </div>
        </section>

        {/* Quick access */}
        <section className="container mx-auto px-4 py-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Acesso rápido</h2>
              <p className="text-muted-foreground text-sm">Vá direto ao que você precisa.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickCards.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="group p-5 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold mb-1">{c.title}</div>
                <div className="text-sm text-muted-foreground">{c.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* O que faz a TE */}
        <section className="bg-muted/40 border-y">
          <div className="container mx-auto px-4 py-14">
            <div className="max-w-2xl mb-8">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                Sobre a TE
              </div>
              <h2 className="text-2xl font-bold mb-2">O papel da Tecnologia Educacional</h2>
              <p className="text-muted-foreground">
                Apoiamos o uso pedagógico da tecnologia no Colégio Positivo,
                conectando pessoas, ferramentas e processos.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {teRoles.map((r) => (
                <div key={r.title} className="p-5 rounded-xl bg-card border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/30 text-foreground mb-3">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold mb-1">{r.title}</div>
                  <div className="text-sm text-muted-foreground">{r.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link to="/sobre" className="text-sm font-medium text-primary hover:underline">
                Saiba mais sobre a equipe →
              </Link>
            </div>
          </div>
        </section>

        {/* Comunicados */}
        <section className="py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Comunicados recentes</h2>
                <p className="text-muted-foreground text-sm">Atualizações da equipe TE.</p>
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
                  <div key={c.id} className="p-5 rounded-xl bg-card border hover:border-primary/50 transition">
                    {c.imagem_url && (
                      <StorageImage
                        path={c.imagem_url}
                        alt={c.titulo}
                        className="w-full aspect-video object-cover rounded-md mb-3 -mt-1"
                      />
                    )}
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
              <div className="p-8 rounded-xl border border-dashed text-center text-sm text-muted-foreground">
                Nenhum comunicado publicado ainda.
              </div>
            )}
          </div>
        </section>

        {/* Ferramentas destaque */}
        <section className="bg-muted/40 border-t">
          <div className="container mx-auto px-4 py-14">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Ferramentas em destaque</h2>
                <p className="text-muted-foreground text-sm">Soluções acompanhadas pela TE.</p>
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
                  <div key={f.id} className="p-5 rounded-xl border bg-card hover:border-primary/50 transition">
                    {f.imagem_url && (
                      <StorageImage
                        path={f.imagem_url}
                        alt={f.nome}
                        className="w-full aspect-video object-cover rounded-md mb-3 -mt-1"
                      />
                    )}
                    <div className="text-xs font-medium text-primary mb-1">{f.categoria}</div>
                    <div className="font-semibold mb-2">{f.nome}</div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {f.descricao}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed bg-card text-center text-sm text-muted-foreground">
                Nenhuma ferramenta cadastrada ainda.
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
