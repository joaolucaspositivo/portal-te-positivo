import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";
import { CATEGORIAS_COMUNICADO } from "@/lib/portal-constants";

export const Route = createFileRoute("/area-te/comunicados")({
  component: AdminComunicados,
});

type C = Partial<{
  id: string; titulo: string; resumo: string; conteudo: string;
  categoria: string; autor: string; data_publicacao: string;
  destaque: boolean; publicado: boolean;
}>;
const empty: C = { titulo: "", conteudo: "", publicado: true, destaque: false, data_publicacao: new Date().toISOString().slice(0, 10) };

function AdminComunicados() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<C | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["admin-comunicados"],
    queryFn: async () => {
      const { data, error } = await supabase.from("comunicados").select("*").order("data_publicacao", { ascending: false });
      if (error) throw error; return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (c: C) => {
      if (!c.titulo?.trim() || !c.conteudo?.trim()) throw new Error("Título e conteúdo obrigatórios");
      if (c.id) {
        const { id, ...rest } = c;
        const { error } = await supabase.from("comunicados").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("comunicados").insert(c as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo."); setEdit(null);
      qc.invalidateQueries({ queryKey: ["admin-comunicados"] });
      qc.invalidateQueries({ queryKey: ["comunicados-public"] });
      qc.invalidateQueries({ queryKey: ["home-comunicados"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  async function remove(id: string) {
    if (!confirm("Excluir este comunicado?")) return;
    const { error } = await supabase.from("comunicados").delete().eq("id", id);
    if (error) return toast.error("Erro.");
    qc.invalidateQueries({ queryKey: ["admin-comunicados"] });
    qc.invalidateQueries({ queryKey: ["comunicados-public"] });
    qc.invalidateQueries({ queryKey: ["home-comunicados"] });
    toast.success("Excluído.");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold">Comunicados</h1><p className="text-muted-foreground">{data.length} cadastrados</p></div>
        <button onClick={() => setEdit({ ...empty })} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Título</th><th className="p-3">Categoria</th><th className="p-3">Data</th><th className="p-3">Publicado</th><th className="p-3">Destaque</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum comunicado.</td></tr>
            ) : data.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.titulo}</td>
                <td className="p-3">{c.categoria}</td>
                <td className="p-3">{new Date(c.data_publicacao).toLocaleDateString("pt-BR")}</td>
                <td className="p-3">{c.publicado ? "Sim" : "Não"}</td>
                <td className="p-3">{c.destaque ? <Star className="h-4 w-4 text-primary fill-current" /> : "—"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEdit(c)} className="p-1.5 hover:bg-muted rounded mr-1"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c.id)} className="p-1.5 hover:bg-muted rounded text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <AdminFormShell title={edit.id ? "Editar comunicado" : "Novo comunicado"}
                        onClose={() => setEdit(null)}
                        onSubmit={() => save.mutate(edit)} loading={save.isPending}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Título *" full>
              <input required value={edit.titulo ?? ""} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Resumo" full>
              <textarea rows={2} value={edit.resumo ?? ""} onChange={(e) => setEdit({ ...edit, resumo: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Conteúdo *" full>
              <textarea rows={6} required value={edit.conteudo ?? ""} onChange={(e) => setEdit({ ...edit, conteudo: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Categoria">
              <select value={edit.categoria ?? ""} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} className={inpCls}>
                <option value="">—</option>{CATEGORIAS_COMUNICADO.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Autor">
              <input value={edit.autor ?? ""} onChange={(e) => setEdit({ ...edit, autor: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Data de publicação">
              <input type="date" value={edit.data_publicacao ?? ""} onChange={(e) => setEdit({ ...edit, data_publicacao: e.target.value })} className={inpCls} />
            </Field>
            <div className="flex gap-4 items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!edit.publicado} onChange={(e) => setEdit({ ...edit, publicado: e.target.checked })} />
                Publicado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!edit.destaque} onChange={(e) => setEdit({ ...edit, destaque: e.target.checked })} />
                Destaque
              </label>
            </div>
          </div>
        </AdminFormShell>
      )}
    </div>
  );
}