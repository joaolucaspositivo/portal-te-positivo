import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { statusColor, urgencyColor } from "@/lib/portal-constants";
import { listSolicitacoesAdmin } from "@/lib/solicitacoes.functions";

export const Route = createFileRoute("/area-te/")({
  component: Dashboard,
});

function Stat({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  const toneCls = tone === "destructive" ? "text-destructive" : "text-primary";

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${toneCls}`}>{value}</div>
    </div>
  );
}

function Dashboard() {
  const listSolicitacoesFn = useServerFn(listSolicitacoesAdmin);

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["admin-solic"],
    queryFn: () => listSolicitacoesFn(),
  });

  const count = (s: string) => solicitacoes.filter((x: any) => x.status === s).length;
  const critical = solicitacoes.filter((x: any) => x.urgencia === "Crítica").length;

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Visão geral das solicitações.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <Stat label="Total" value={solicitacoes.length} />
        <Stat label="Recebidas" value={count("Recebida")} />
        <Stat label="Em análise" value={count("Em análise")} />
        <Stat label="Em execução" value={count("Em execução")} />
        <Stat label="Concluídas" value={count("Concluída")} />
        <Stat label="Críticas" value={critical} tone="destructive" />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold">Solicitações recentes</h2>
          <Link to="/area-te/solicitacoes" className="text-sm text-primary hover:underline">
            Ver todas →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Título</th>
                <th className="p-3">Solicitante</th>
                <th className="p-3">Unidade</th>
                <th className="p-3">Urgência</th>
                <th className="p-3">Status</th>
                <th className="p-3">Data</th>
              </tr>
            </thead>

            <tbody>
              {solicitacoes.slice(0, 8).map((s: any) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <Link
                      to="/area-te/solicitacoes/$id"
                      params={{ id: s.id }}
                      className="font-medium hover:underline"
                    >
                      {s.titulo}
                    </Link>
                  </td>
                  <td className="p-3">{s.nome_solicitante}</td>
                  <td className="p-3">{s.unidade}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${urgencyColor(s.urgencia)}`}>
                      {s.urgencia}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}

              {solicitacoes.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Nenhuma solicitação ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}