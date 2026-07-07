import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Inbox, Search } from "lucide-react";
import {
  badgeColorFromConfig,
  badgeStyleFromConfig,
} from "@/lib/portal-constants";
import {
  listPrioridadesSolicitacaoPublic,
  listStatusSolicitacaoPublic,
} from "@/lib/configuracoes.functions";
import { useAuth } from "@/lib/use-auth";
import { listMinhasSolicitacoes } from "@/lib/solicitacoes.functions";

export const Route = createFileRoute("/area-te/minhas-solicitacoes/")({
  component: MinhasSolicitacoesPage,
});

function MinhasSolicitacoesPage() {
  const { user, loading } = useAuth();

  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [unidade, setUnidade] = useState("");
  const [status, setStatus] = useState("");
  const [urg, setUrg] = useState("");
  const [apenasAbertas, setApenasAbertas] = useState(false);

  const listFn = useServerFn(listMinhasSolicitacoes);
  const listStatusFn = useServerFn(listStatusSolicitacaoPublic);
  const listPrioridadesFn = useServerFn(listPrioridadesSolicitacaoPublic);

  const { data: solicitacoes = [], isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["minhas-solicitacoes", user?.id],
    queryFn: () => listFn(),
  });

  const { data: statusOptions = [] } = useQuery({
    queryKey: ["status-solicitacao"],
    queryFn: () => listStatusFn(),
  });

  const { data: prioridadeOptions = [] } = useQuery({
    queryKey: ["prioridades-solicitacao"],
    queryFn: () => listPrioridadesFn(),
  });

  const statusAbertos = useMemo(() => {
    return new Set(
      statusOptions
        .filter((s: any) => !!s.aberta)
        .map((s: any) => s.nome),
    );
  }, [statusOptions]);

  const tipoOptions = useMemo(() => {
    return Array.from(
      new Set(solicitacoes.map((s: any) => s.tipo_solicitacao).filter(Boolean)),
    ).sort();
  }, [solicitacoes]);

  const unidadeOptions = useMemo(() => {
    return Array.from(
      new Set(solicitacoes.map((s: any) => s.unidade).filter(Boolean)),
    ).sort();
  }, [solicitacoes]);

  const statusColorMap = useMemo(() => {
    return new Map(statusOptions.map((s: any) => [s.nome, s.cor]));
  }, [statusOptions]);

  const prioridadeColorMap = useMemo(() => {
    return new Map(prioridadeOptions.map((p: any) => [p.nome, p.cor]));
  }, [prioridadeOptions]);

  const prioridadePesoMap = useMemo(() => {
    return new Map(
      prioridadeOptions.map((p: any) => [p.nome, Number(p.peso ?? 0)]),
    );
  }, [prioridadeOptions]);

  const maiorPesoPrioridade = useMemo(() => {
    return prioridadeOptions.reduce((max: number, p: any) => {
      return Math.max(max, Number(p.peso ?? 0));
    }, 0);
  }, [prioridadeOptions]);

  const filtered = solicitacoes.filter((s: any) => {
    if (q) {
      const text = `${s.titulo} ${s.tipo_solicitacao} ${s.unidade} ${s.descricao} ${s.status} ${s.urgencia}`.toLowerCase();

      if (!text.includes(q.toLowerCase())) return false;
    }

    if (tipo && s.tipo_solicitacao !== tipo) return false;
    if (unidade && s.unidade !== unidade) return false;
    if (status && s.status !== status) return false;
    if (urg && s.urgencia !== urg) return false;
    if (apenasAbertas && !statusAbertos.has(s.status)) return false;

    return true;
  });

  const summary = {
    total: solicitacoes.length,
    abertas: solicitacoes.filter((s: any) => statusAbertos.has(s.status)).length,
    criticas: solicitacoes.filter((s: any) => {
      const peso = prioridadePesoMap.get(s.urgencia) ?? 0;

      return maiorPesoPrioridade > 0 && peso === maiorPesoPrioridade;
    }).length,
    comResponsavel: solicitacoes.filter((s: any) => !!s.responsavel_id).length,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Minhas solicitações</h1>

      <p className="text-muted-foreground mb-6">
        {filtered.length} solicitações encontradas · {summary.abertas} abertas
      </p>

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !user ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

          <h2 className="text-xl font-semibold">
            Entre para acompanhar suas solicitações
          </h2>

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
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Abertas" value={summary.abertas} />
            <SummaryCard label="Críticas" value={summary.criticas} />
            <SummaryCard label="Com responsável" value={summary.comResponsavel} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 mb-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título, tipo, unidade ou descrição…"
                className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            >
              <option value="">Todos tipos</option>
              {tipoOptions.map((t: any) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            >
              <option value="">Todas unidades</option>
              {unidadeOptions.map((t: any) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            >
              <option value="">Todos status</option>
              {statusOptions.map((t: any) => (
                <option key={t.id} value={t.nome}>
                  {t.nome}
                </option>
              ))}
            </select>

            <select
              value={urg}
              onChange={(e) => setUrg(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            >
              <option value="">Todas urgências</option>
              {prioridadeOptions.map((t: any) => (
                <option key={t.id} value={t.nome}>
                  {t.nome}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 px-3 py-2 rounded-md border bg-background text-sm">
              <input
                type="checkbox"
                checked={apenasAbertas}
                onChange={(e) => setApenasAbertas(e.target.checked)}
              />
              Apenas abertas
            </label>
          </div>

          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Título</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Unidade</th>
                  <th className="p-3">Urgência</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Data</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s: any) => (
                    <tr key={s.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{s.titulo}</div>
                        {s.descricao && (
                          <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {s.descricao}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {s.tipo_solicitacao}
                      </td>

                      <td className="p-3">{s.unidade}</td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center whitespace-nowrappx-2 py-0.5 rounded text-xs ${badgeColorFromConfig(
                            prioridadeColorMap.get(s.urgencia) as string | null,
                          )}`}
                          style={badgeStyleFromConfig(
                            prioridadeColorMap.get(s.urgencia) as string | null,
                          )}
                        >
                          {s.urgencia}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded text-xs ${badgeColorFromConfig(
                            statusColorMap.get(s.status) as string | null,
                          )}`}
                          style={badgeStyleFromConfig(
                            statusColorMap.get(s.status) as string | null,
                          )}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {s.responsavel?.nome_completo || s.responsavel_te || "—"}
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      </td>

                      <td className="p-3">
                        <Link
                          to="/area-te/minhas-solicitacoes/$id"
                          params={{ id: s.id }}
                          className="text-sm text-primary hover:underline"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}