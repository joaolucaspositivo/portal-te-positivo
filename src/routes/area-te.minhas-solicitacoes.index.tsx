import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Inbox } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { listMinhasSolicitacoes } from "@/lib/solicitacoes.functions";

export const Route = createFileRoute("/area-te/minhas-solicitacoes/")({
  component: MinhasSolicitacoesPage,
});

function MinhasSolicitacoesPage() {
  const { user, loading } = useAuth();
  const listFn = useServerFn(listMinhasSolicitacoes);

  const { data: solicitacoes = [], isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["minhas-solicitacoes", user?.id],
    queryFn: () => listFn(),
  });

  return (
  <div className="space-y-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold">Minhas solicitações</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Acompanhe as solicitações que você abriu para a equipe de Tecnologia Educacional.
        </p>
      </section>

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !user ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Entre para acompanhar suas solicitações</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O acompanhamento fica disponível para usuários logados.
          </p>

          <Link
            to="/auth"
            className="mt-5 inline-flex rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground"
          >
            Entrar
          </Link>
        </div>
      ) : isLoading ? (
        <p className="text-muted-foreground">Carregando solicitações…</p>
      ) : solicitacoes.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Nenhuma solicitação encontrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quando você abrir uma solicitação, ela aparecerá aqui.
          </p>

          <Link
            to="/solicitacoes"
            className="mt-5 inline-flex rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground"
          >
            Abrir solicitação
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitacoes.map((s: any) => (
            <Link
              key={s.id}
              to="/area-te/minhas-solicitacoes/$id"
              params={{ id: s.id }}
              className="group block rounded-xl border bg-card p-5 transition-colors hover:border-primary"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                      {s.status}
                    </span>

                    <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                      {s.urgencia}
                    </span>

                    <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                      {s.tipo_solicitacao}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold group-hover:text-primary">
                    {s.titulo}
                  </h2>

                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {s.descricao}
                  </p>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Aberta em {new Date(s.created_at).toLocaleString("pt-BR")}
                    {s.unidade ? ` · ${s.unidade}` : ""}
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                  Acompanhar <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    <div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}