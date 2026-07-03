import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  badgeColorFromConfig,
  badgeStyleFromConfig,
} from "@/lib/portal-constants";
import {
  listPrioridadesSolicitacaoPublic,
  listStatusSolicitacaoPublic,
} from "@/lib/configuracoes.functions";
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
  const listStatusFn = useServerFn(listStatusSolicitacaoPublic);
  const listPrioridadesFn = useServerFn(listPrioridadesSolicitacaoPublic);

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["admin-solic"],
    queryFn: () => listSolicitacoesFn(),
  });

  const { data: statusOptions = [] } = useQuery({
    queryKey: ["status-solicitacao"],
    queryFn: () => listStatusFn(),
  });

  const { data: prioridadeOptions = [] } = useQuery({
    queryKey: ["prioridades-solicitacao"],
    queryFn: () => listPrioridadesFn(),
  });

  const statusColorMap = new Map(statusOptions.map((s: any) => [s.nome, s.cor]));
  const prioridadeColorMap = new Map(prioridadeOptions.map((p: any) => [p.nome, p.cor]));

  const statusAbertos = new Set(
    statusOptions.filter((s: any) => !!s.aberta).map((s: any) => s.nome),
  );

  const prioridadeMaisAlta = prioridadeOptions.reduce((best: any | null, atual: any) => {
    if (!best) return atual;

    return Number(atual.peso ?? 0) > Number(best.peso ?? 0) ? atual : best;
  }, null);

  const countStatus = (status: string) =>
    solicitacoes.filter((x: any) => x.status === status).length;

  const abertas = solicitacoes.filter((x: any) => statusAbertos.has(x.status)).length;

  const altaPrioridade = prioridadeMaisAlta
    ? solicitacoes.filter((x: any) => x.urgencia === prioridadeMaisAlta.nome).length
    : 0;

  const statusCards = statusOptions.slice(0, 3);

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Visão geral das solicitações.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <Stat label="Total" value={solicitacoes.length} />
        <Stat label="Abertas" value={abertas} />

        {statusCards.map((s: any) => (
          <Stat key={s.id} label={s.nome} value={countStatus(s.nome)} />
        ))}

        <Stat
          label={prioridadeMaisAlta?.nome ?? "Maior prioridade"}
          value={altaPrioridade}
          tone="destructive"
        />
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
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${badgeColorFromConfig(
                        prioridadeColorMap.get(s.urgencia) as string | null,
                      )}`}
                      style={badgeStyleFromConfig(prioridadeColorMap.get(s.urgencia) as string | null)}
                    >
                      {s.urgencia}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${badgeColorFromConfig(
                        statusColorMap.get(s.status) as string | null,
                      )}`}
                      style={badgeStyleFromConfig(statusColorMap.get(s.status) as string | null)}
                    >
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