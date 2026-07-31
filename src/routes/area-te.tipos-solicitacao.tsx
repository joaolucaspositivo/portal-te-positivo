import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { listTiposAdmin, saveTipo, deleteTipo } from "@/lib/solicitacoes.functions";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";

export const Route = createFileRoute("/area-te/tipos-solicitacao")({
  component: Layout,
});

function Layout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/area-te/tipos-solicitacao") return <Outlet />;
  return <List />;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function List() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTiposAdmin);
  const saveFn = useServerFn(saveTipo);
  const deleteFn = useServerFn(deleteTipo);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-tipos"],
    queryFn: () => listFn(),
  });

  const [edit, setEdit] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: async (t: any) => {
      const payload = {
        id: t.id as string | undefined,
        nome: t.nome?.trim(),
        slug: t.slug?.trim() || slugify(t.nome ?? ""),
        descricao: t.descricao ?? null,
        icone: t.icone ?? null,
        ordem: Number(t.ordem ?? 0),
        ativo: t.ativo ?? true,
      };
      if (!payload.nome) throw new Error("Nome obrigatório");
      await saveFn({ data: payload });
    },
    onSuccess: () => { toast.success("Salvo."); setEdit(null); qc.invalidateQueries({ queryKey: ["admin-tipos"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  async function remove(id: string) {
    if (!confirm("Excluir este tipo e todos os seus campos?")) return;
    try {
      await deleteFn({ data: { id } });
    } catch (e: any) {
      return toast.error(e?.message ?? "Erro ao excluir.");
    }
    qc.invalidateQueries({ queryKey: ["admin-tipos"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tipos de solicitação</h1>
          <p className="text-muted-foreground">Crie e edite os formulários disponíveis ao público.</p>
        </div>
        <button onClick={() => setEdit({ ativo: true, ordem: 0 })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium">
          <Plus className="h-4 w-4" /> Novo tipo
        </button>
      </div>
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Nome</th><th className="p-3">Slug</th><th className="p-3">Ordem</th>
              <th className="p-3">Campos</th><th className="p-3">Ativo</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum tipo cadastrado.</td></tr>
            ) : data.map((t: any) => (
              <tr key={t.id} className="border-t hover:bg-muted/30">
                <td className="p-3">
                  <Link to="/area-te/tipos-solicitacao/$id" params={{ id: t.id }} className="font-medium hover:underline">
                    {t.nome}
                  </Link>
                  {t.descricao && <div className="text-xs text-muted-foreground">{t.descricao}</div>}
                </td>
                <td className="p-3 text-muted-foreground font-mono text-xs">{t.slug}</td>
                <td className="p-3">{t.ordem}</td>
                <td className="p-3">{t.campos_count ?? 0}</td>
                <td className="p-3">{t.ativo ? "Sim" : "Não"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEdit(t)} className="p-1.5 hover:bg-muted rounded mr-1"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(t.id)} className="p-1.5 hover:bg-muted rounded text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <AdminFormShell title={edit.id ? "Editar tipo" : "Novo tipo"} onClose={() => setEdit(null)}
                        onSubmit={() => save.mutate(edit)} loading={save.isPending}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome *" full>
              <input required value={edit.nome ?? ""}
                     onChange={(e) => setEdit({ ...edit, nome: e.target.value, slug: edit.id ? edit.slug : slugify(e.target.value) })}
                     className={inpCls} />
            </Field>
            <Field label="Slug *" full>
              <input required value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} className={inpCls} />
            </Field>
            <Field label="Descrição" full>
              <textarea rows={2} value={edit.descricao ?? ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Ordem">
              <input type="number" value={edit.ordem ?? 0} onChange={(e) => setEdit({ ...edit, ordem: Number(e.target.value) })} className={inpCls} />
            </Field>
            <Field label="Ícone (lucide name)">
              <input value={edit.icone ?? ""} onChange={(e) => setEdit({ ...edit, icone: e.target.value })} className={inpCls} placeholder="inbox" />
            </Field>
            <label className="flex items-center gap-2 text-sm col-span-2">
              <input type="checkbox" checked={!!edit.ativo} onChange={(e) => setEdit({ ...edit, ativo: e.target.checked })} />
              Ativo (visível ao público)
            </label>
          </div>
        </AdminFormShell>
      )}
    </div>
  );
}