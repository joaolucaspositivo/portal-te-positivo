import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search, Shield, Plus, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";
import {
  listUnidades,
  createUnidade,
  setUnidadeStatus,
  deleteUnidade,
} from "@/lib/unidades.functions";

export const Route = createFileRoute("/area-te/unidades")({
  component: UnidadesLayout,
});

function UnidadesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/area-te/unidades") return <Outlet />;
  return <UnidadesList />;
}

function UnidadesList() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const list = useServerFn(listUnidades);
  const { data = [], isLoading } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-unidades"],
    queryFn: () => list(),
  });

  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("");
  const [creating, setCreating] = useState(false);

  const setStatusMut = useMutation({
    mutationFn: useServerFn(setUnidadeStatus),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-unidades"] }); toast.success("Status atualizado."); },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });
  const delMut = useMutation({
    mutationFn: useServerFn(deleteUnidade),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-unidades"] }); toast.success("Unidade excluída."); },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  const filtered = useMemo(
    () => data.filter((u: any) => {
      if (statusF && u.status !== statusF) return false;
      if (q) {
        const t = `${u.nome} ${u.sigla} ${u.cidade ?? ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    }),
    [data, q, statusF],
  );

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!isAdmin)
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-semibold">Acesso restrito</p>
        <p className="text-sm text-muted-foreground">Apenas administradores podem gerenciar unidades.</p>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold">Unidades</h1>
          <p className="text-muted-foreground">{data.length} unidades cadastradas</p>
        </div>
        <button onClick={() => setCreating(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          <Plus className="h-4 w-4" /> Nova unidade
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_200px] mt-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, sigla ou cidade…"
                 className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm" />
        </div>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background text-sm">
          <option value="">Todos status</option>
          <option value="ativa">Ativas</option>
          <option value="inativa">Inativas</option>
        </select>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Unidade</th>
              <th className="p-3">Sigla</th>
              <th className="p-3">Cidade / UF</th>
              <th className="p-3">Usuários</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma unidade.</td></tr>
            ) : filtered.map((u: any) => (
              <tr key={u.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">
                  <Link to="/area-te/unidades/$id" params={{ id: u.id }} className="hover:underline">{u.nome}</Link>
                </td>
                <td className="p-3 text-muted-foreground">{u.sigla}</td>
                <td className="p-3 text-muted-foreground">
                  {u.cidade ? `${u.cidade}${u.estado ? ` / ${u.estado}` : ""}` : "—"}
                </td>
                <td className="p-3">{u.usuarios_count}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.status === "ativa" ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"}`}>
                    {u.status === "ativa" ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Link to="/area-te/unidades/$id" params={{ id: u.id }} className="p-1.5 rounded hover:bg-muted inline-block mr-1" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  {u.status === "ativa" ? (
                    <button onClick={() => setStatusMut.mutate({ data: { id: u.id, status: "inativa" } })}
                            className="p-1.5 rounded hover:bg-muted inline-block mr-1" title="Desativar">
                      <PowerOff className="h-4 w-4" />
                    </button>
                  ) : (
                    <button onClick={() => setStatusMut.mutate({ data: { id: u.id, status: "ativa" } })}
                            className="p-1.5 rounded hover:bg-muted inline-block mr-1" title="Ativar">
                      <Power className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => {
                    if (confirm(`Excluir unidade "${u.nome}"? Esta ação só funciona se não houver usuários nem solicitações vinculadas.`))
                      delMut.mutate({ data: { id: u.id } });
                  }} className="p-1.5 rounded hover:bg-muted inline-block text-destructive" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && <CreateUnidadeForm onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreateUnidadeForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState({
    nome: "", sigla: "", status: "ativa" as "ativa" | "inativa",
    cep: "", logradouro: "", numero: "", complemento: "",
    bairro: "", cidade: "", estado: "",
    telefone: "", email: "",
    responsavel_nome: "", responsavel_cargo: "",
  });
  const createFn = useServerFn(createUnidade);
  const save = useMutation({
    mutationFn: () => createFn({ data: v as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-unidades"] }); toast.success("Unidade criada."); onClose(); },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });
  return (
    <AdminFormShell title="Nova unidade" onClose={onClose} onSubmit={() => save.mutate()} loading={save.isPending}>
      <UnidadeFields value={v} onChange={setV} />
    </AdminFormShell>
  );
}

export function UnidadeFields({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const set = (k: string, val: any) => onChange({ ...value, [k]: val });
  return (
    <>
      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Identificação</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome *" full><input required value={value.nome} onChange={(e) => set("nome", e.target.value)} className={inpCls} /></Field>
        <Field label="Sigla *"><input required value={value.sigla} onChange={(e) => set("sigla", e.target.value)} className={inpCls} /></Field>
        <Field label="Status">
          <select value={value.status} onChange={(e) => set("status", e.target.value)} className={inpCls}>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </select>
        </Field>
      </div>
      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider pt-2 border-t">Endereço</div>
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-2"><Field label="CEP"><input value={value.cep} onChange={(e) => set("cep", e.target.value)} className={inpCls} /></Field></div>
        <div className="col-span-3"><Field label="Logradouro"><input value={value.logradouro} onChange={(e) => set("logradouro", e.target.value)} className={inpCls} /></Field></div>
        <div className="col-span-1"><Field label="Número"><input value={value.numero} onChange={(e) => set("numero", e.target.value)} className={inpCls} /></Field></div>
        <div className="col-span-3"><Field label="Complemento"><input value={value.complemento} onChange={(e) => set("complemento", e.target.value)} className={inpCls} /></Field></div>
        <div className="col-span-3"><Field label="Bairro"><input value={value.bairro} onChange={(e) => set("bairro", e.target.value)} className={inpCls} /></Field></div>
        <div className="col-span-4"><Field label="Cidade"><input value={value.cidade} onChange={(e) => set("cidade", e.target.value)} className={inpCls} /></Field></div>
        <div className="col-span-2"><Field label="UF"><input maxLength={2} value={value.estado} onChange={(e) => set("estado", e.target.value.toUpperCase())} className={inpCls} /></Field></div>
      </div>
      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider pt-2 border-t">Contato</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone"><input value={value.telefone} onChange={(e) => set("telefone", e.target.value)} className={inpCls} /></Field>
        <Field label="E-mail"><input type="email" value={value.email} onChange={(e) => set("email", e.target.value)} className={inpCls} /></Field>
        <Field label="Responsável"><input value={value.responsavel_nome} onChange={(e) => set("responsavel_nome", e.target.value)} className={inpCls} /></Field>
        <Field label="Cargo do responsável"><input value={value.responsavel_cargo} onChange={(e) => set("responsavel_cargo", e.target.value)} className={inpCls} /></Field>
      </div>
    </>
  );
}