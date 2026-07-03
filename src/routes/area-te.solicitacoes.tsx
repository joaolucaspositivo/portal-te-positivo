import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { badgeColorFromConfig } from "@/lib/portal-constants";
import {
  listEquipeTeOptions,
  listSolicitacaoTiposPublic,
  listSolicitacoesAdmin,
} from "@/lib/solicitacoes.functions";
import {
  listPrioridadesSolicitacaoPublic,
  listStatusSolicitacaoPublic,
} from "@/lib/configuracoes.functions";
import { listUnidadesPublicas } from "@/lib/unidades.functions";


export const Route = createFileRoute("/area-te/solicitacoes")({
  component: SolicListLayout,
});

function SolicListLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/area-te/solicitacoes") return <Outlet />;

  return <List />;
}

function List() {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [unidade, setUnidade] = useState("");
  const [status, setStatus] = useState("");
  const [urg, setUrg] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [apenasAbertas, setApenasAbertas] = useState(false);

  const listSolicitacoesFn = useServerFn(listSolicitacoesAdmin);
  const listEquipeFn = useServerFn(listEquipeTeOptions);

  const listTiposFn = useServerFn(listSolicitacaoTiposPublic);
  const listStatusFn = useServerFn(listStatusSolicitacaoPublic);
  const listPrioridadesFn = useServerFn(listPrioridadesSolicitacaoPublic);

  const listUnidadesFn = useServerFn(listUnidadesPublicas);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-solicitacoes", status, urg, responsavelId, apenasAbertas],
    queryFn: () =>
      listSolicitacoesFn({
        data: {
          status: status || null,
          urgencia: urg || null,
          responsavel_id: responsavelId || null,
          apenas_abertas: apenasAbertas,
        },
      }),
  });

  const { data: equipe = [] } = useQuery({
    queryKey: ["equipe-te-options"],
    queryFn: () => listEquipeFn(),
  });

  const { data: tiposSolicitacao = [] } = useQuery({
    queryKey: ["public-tipos"],
    queryFn: () => listTiposFn(),
  });

  const { data: statusOptions = [] } = useQuery({
    queryKey: ["status-solicitacao"],
    queryFn: () => listStatusFn(),
  });

  const { data: prioridadeOptions = [] } = useQuery({
    queryKey: ["prioridades-solicitacao"],
    queryFn: () => listPrioridadesFn(),
  });

  const { data: unidadesCadastradas = [] } = useQuery({
    queryKey: ["unidades-publicas"],
    queryFn: () => listUnidadesFn(),
  });



  const tipoOptions = useMemo(() => {
    const cadastrados = tiposSolicitacao.map((t: any) => t.nome).filter(Boolean);
    const usados = data.map((s: any) => s.tipo_solicitacao).filter(Boolean);

    return Array.from(new Set([...cadastrados, ...usados])).sort();
  }, [data, tiposSolicitacao]);

  const unidadeOptions = useMemo(() => {
    const cadastradas = unidadesCadastradas.map((u: any) => u.nome).filter(Boolean);
    const usadas = data.map((s: any) => s.unidade).filter(Boolean);

    return Array.from(new Set([...cadastradas, ...usadas])).sort();
  }, [data, unidadesCadastradas]);

  const filtered = data.filter((s: any) => {
    if (q) {
      const t = `${s.titulo} ${s.nome_solicitante} ${s.email_solicitante} ${s.descricao}`.toLowerCase();

      if (!t.includes(q.toLowerCase())) return false;
    }

    if (tipo && s.tipo_solicitacao !== tipo) return false;
    if (unidade && s.unidade !== unidade) return false;

    return true;
  });

  const statusAbertos = useMemo(() => {
    return new Set(
      statusOptions
        .filter((s: any) => !!s.aberta)
        .map((s: any) => s.nome),
    );
  }, [statusOptions]);

  const maiorPesoPrioridade = useMemo(() => {
    return prioridadeOptions.reduce((max: number, p: any) => {
      return Math.max(max, Number(p.peso ?? 0));
    }, 0);
  }, [prioridadeOptions]);

  const prioridadePesoMap = useMemo(() => {
    return new Map(
      prioridadeOptions.map((p: any) => [p.nome, Number(p.peso ?? 0)]),
    );
  }, [prioridadeOptions]);

  const statusColorMap = useMemo(() => {
    return new Map(statusOptions.map((s: any) => [s.nome, s.cor]));
  }, [statusOptions]);

  const prioridadeColorMap = useMemo(() => {
    return new Map(prioridadeOptions.map((p: any) => [p.nome, p.cor]));
  }, [prioridadeOptions]);

  const summary = {
    total: data.length,
    abertas: data.filter((s: any) => statusAbertos.has(s.status)).length,
    criticas: data.filter((s: any) => {
      const peso = prioridadePesoMap.get(s.urgencia) ?? 0;
      return maiorPesoPrioridade > 0 && peso === maiorPesoPrioridade;
    }).length,
    semResponsavel: data.filter((s: any) => !s.responsavel_id).length,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Solicitações</h1>
      <p className="text-muted-foreground mb-6">
        {filtered.length} solicitações encontradas · {summary.abertas} abertas
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Abertas" value={summary.abertas} />
        <SummaryCard label="Críticas" value={summary.criticas} />
        <SummaryCard label="Sem responsável" value={summary.semResponsavel} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 mb-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, solicitante, e-mail ou descrição…"
            className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm"
          />
        </div>

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="">Todos tipos</option>
          {tipoOptions.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <select
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="">Todas unidades</option>
          {unidadeOptions.map((t) => (
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

        <select
          value={responsavelId}
          onChange={(e) => setResponsavelId(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="">Todos responsáveis</option>
          {equipe.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.nome_completo || p.email}
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
              <th className="p-3">Solicitante</th>
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
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  Nenhuma solicitação.
                </td>
              </tr>
            ) : (
              filtered.map((s: any) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{s.titulo}</td>
                  <td className="p-3 text-muted-foreground">{s.tipo_solicitacao}</td>
                  <td className="p-3">
                    <div>{s.nome_solicitante}</div>
                    <div className="text-xs text-muted-foreground">{s.email_solicitante}</div>
                  </td>
                  <td className="p-3">{s.unidade}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${badgeColorFromConfig(
                        prioridadeColorMap.get(s.urgencia) as string | null,
                      )}`}
                    >
                      {s.urgencia}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${badgeColorFromConfig(
                        statusColorMap.get(s.status) as string | null,
                      )}`}
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
                      to="/area-te/solicitacoes/$id"
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