import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listSolicitacoes } from "@/lib/solicitacoes.functions";
import {
  STATUS_SOLICITACAO, TIPOS_SOLICITACAO, URGENCIAS, UNIDADES,
  statusColor, urgencyColor,
} from "@/lib/portal-constants";

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
  const listFn = useServerFn(listSolicitacoes);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-solicitacoes"],
    queryFn: () => listFn(),
  });
  const filtered = data.filter((s: any) => {
    if (q) {
      const t = `${s.titulo} ${s.nome_solicitante} ${s.descricao}`.toLowerCase();
      if (!t.includes(q.toLowerCase())) return false;
    }
    if (tipo && s.tipo_solicitacao !== tipo) return false;
    if (unidade && s.unidade !== unidade) return false;
    if (status && s.status !== status) return false;
    if (urg && s.urgencia !== urg) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">Solicitações</h1>
      <p className="text-muted-foreground mb-6">{filtered.length} solicitações</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-4">
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…"
                 className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm" />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="px-3 py-2 rounded-md border bg-background text-sm">
          <option value="">Todos tipos</option>{TIPOS_SOLICITACAO.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={unidade} onChange={(e) => setUnidade(e.target.value)} className="px-3 py-2 rounded-md border bg-background text-sm">
          <option value="">Todas unidades</option>{UNIDADES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-md border bg-background text-sm">
          <option value="">Todos status</option>{STATUS_SOLICITACAO.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={urg} onChange={(e) => setUrg(e.target.value)} className="px-3 py-2 rounded-md border bg-background text-sm">
          <option value="">Todas urgências</option>{URGENCIAS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Título</th><th className="p-3">Tipo</th><th className="p-3">Solicitante</th><th className="p-3">Unidade</th><th className="p-3">Urgência</th><th className="p-3">Status</th><th className="p-3">Data</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nenhuma solicitação.</td></tr>
            ) : filtered.map((s: any) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{s.titulo}</td>
                <td className="p-3 text-muted-foreground">{s.tipo_solicitacao}</td>
                <td className="p-3">{s.nome_solicitante}</td>
                <td className="p-3">{s.unidade}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${urgencyColor(s.urgencia)}`}>{s.urgencia}</span></td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${statusColor(s.status)}`}>{s.status}</span></td>
                <td className="p-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="p-3">
                  <Link to="/area-te/solicitacoes/$id" params={{ id: s.id }}
                        className="text-sm text-primary hover:underline">Abrir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}