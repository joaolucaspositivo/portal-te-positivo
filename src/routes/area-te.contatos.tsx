import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";
import { UNIDADES, TIPOS_CONTATO } from "@/lib/portal-constants";

export const Route = createFileRoute("/area-te/contatos")({
  component: AdminContatos,
});

type C = Partial<{
  id: string; nome: string; funcao: string; unidade: string; email: string;
  telefone_whatsapp: string; tipo_contato: string; ativo: boolean;
}>;
const empty: C = { nome: "", ativo: true };

function AdminContatos() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<C | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["admin-contatos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contatos").select("*").order("nome");
      if (error) throw error; return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (c: C) => {
      if (!c.nome?.trim()) throw new Error("Nome obrigatório");
      if (c.id) {
        const { id, ...rest } = c;
        const { error } = await supabase.from("contatos").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contatos").insert(c as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo."); setEdit(null);
      qc.invalidateQueries({ queryKey: ["admin-contatos"] });
      qc.invalidateQueries({ queryKey: ["contatos-public"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  async function remove(id: string) {
    if (!confirm("Excluir este contato?")) return;
    const { error } = await supabase.from("contatos").delete().eq("id", id);
    if (error) return toast.error("Erro.");
    qc.invalidateQueries({ queryKey: ["admin-contatos"] });
    qc.invalidateQueries({ queryKey: ["contatos-public"] });
    toast.success("Excluído.");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold">Contatos</h1><p className="text-muted-foreground">{data.length} cadastrados</p></div>
        <button onClick={() => setEdit({ ...empty })} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Nome</th><th className="p-3">Função</th><th className="p-3">Unidade</th><th className="p-3">Tipo</th><th className="p-3">Ativo</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum contato.</td></tr>
            ) : data.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.nome}</td>
                <td className="p-3">{c.funcao}</td>
                <td className="p-3">{c.unidade}</td>
                <td className="p-3">{c.tipo_contato}</td>
                <td className="p-3">{c.ativo ? "Sim" : "Não"}</td>
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
        <AdminFormShell title={edit.id ? "Editar contato" : "Novo contato"}
                        onClose={() => setEdit(null)}
                        onSubmit={() => save.mutate(edit)} loading={save.isPending}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome *" full>
              <input required value={edit.nome ?? ""} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Função"><input value={edit.funcao ?? ""} onChange={(e) => setEdit({ ...edit, funcao: e.target.value })} className={inpCls} /></Field>
            <Field label="Unidade">
              <select value={edit.unidade ?? ""} onChange={(e) => setEdit({ ...edit, unidade: e.target.value })} className={inpCls}>
                <option value="">—</option>{UNIDADES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="E-mail"><input type="email" value={edit.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} className={inpCls} /></Field>
            <Field label="Telefone / WhatsApp"><input value={edit.telefone_whatsapp ?? ""} onChange={(e) => setEdit({ ...edit, telefone_whatsapp: e.target.value })} className={inpCls} /></Field>
            <Field label="Tipo de contato" full>
              <select value={edit.tipo_contato ?? ""} onChange={(e) => setEdit({ ...edit, tipo_contato: e.target.value })} className={inpCls}>
                <option value="">—</option>{TIPOS_CONTATO.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm col-span-2">
              <input type="checkbox" checked={!!edit.ativo} onChange={(e) => setEdit({ ...edit, ativo: e.target.checked })} />
              Ativo (visível no portal público)
            </label>
          </div>
        </AdminFormShell>
      )}
    </div>
  );
}