import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { listFerramentasPublic, saveFerramenta, deleteFerramenta } from "@/lib/conteudo.functions";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";
import { CATEGORIAS_FERRAMENTA, STATUS_FERRAMENTA, statusColor } from "@/lib/portal-constants";
import { ImageUploadField } from "@/components/image-upload-field";

export const Route = createFileRoute("/area-te/ferramentas")({
  component: AdminFerramentas,
});

type F = Partial<{
  id: string; nome: string; descricao: string; categoria: string;
  publico_alvo: string; segmento: string; link_acesso: string;
  responsavel: string; status: string; imagem_url: string | null;
}>;
const empty: F = { nome: "", status: "Ativa" };

function AdminFerramentas() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<F | null>(null);
  const listFn = useServerFn(listFerramentasPublic);
  const saveFn = useServerFn(saveFerramenta);
  const deleteFn = useServerFn(deleteFerramenta);
  const { data = [] } = useQuery({
    queryKey: ["admin-ferramentas"],
    queryFn: () => listFn(),
  });

  const save = useMutation({
    mutationFn: async (f: F) => {
      if (!f.nome?.trim()) throw new Error("Nome obrigatório");
      await saveFn({
        data: {
          id: f.id,
          nome: f.nome,
          descricao: f.descricao ?? null,
          categoria: f.categoria ?? null,
          publico_alvo: f.publico_alvo ?? null,
          segmento: f.segmento ?? null,
          link_acesso: f.link_acesso ?? null,
          responsavel: f.responsavel ?? null,
          imagem_url: f.imagem_url ?? null,
          status: f.status ?? "Ativa",
        },
      });
    },
    onSuccess: () => { toast.success("Salvo."); setEdit(null); qc.invalidateQueries({ queryKey: ["admin-ferramentas"] }); qc.invalidateQueries({ queryKey: ["ferramentas"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar."),
  });

  async function remove(id: string) {
    if (!confirm("Excluir esta ferramenta?")) return;
    try {
      await deleteFn({ data: { id } });
    } catch {
      return toast.error("Erro ao excluir.");
    }
    toast.success("Excluída.");
    qc.invalidateQueries({ queryKey: ["admin-ferramentas"] });
    qc.invalidateQueries({ queryKey: ["ferramentas"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold">Ferramentas</h1><p className="text-muted-foreground">{data.length} cadastradas</p></div>
        <button onClick={() => setEdit({ ...empty })} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Nome</th><th className="p-3">Categoria</th><th className="p-3">Status</th><th className="p-3">Responsável</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhuma ferramenta.</td></tr>
            ) : data.map((f: any) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 font-medium">{f.nome}</td>
                <td className="p-3">{f.categoria}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${statusColor(f.status)}`}>{f.status}</span></td>
                <td className="p-3">{f.responsavel}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEdit(f)} className="p-1.5 hover:bg-muted rounded mr-1"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(f.id)} className="p-1.5 hover:bg-muted rounded text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <AdminFormShell title={edit.id ? "Editar ferramenta" : "Nova ferramenta"}
                        onClose={() => setEdit(null)}
                        onSubmit={() => save.mutate(edit)} loading={save.isPending}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome *" full>
              <input required value={edit.nome ?? ""} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Descrição" full>
              <textarea rows={3} value={edit.descricao ?? ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Categoria">
              <select value={edit.categoria ?? ""} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} className={inpCls}>
                <option value="">—</option>{CATEGORIAS_FERRAMENTA.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={edit.status ?? "Ativa"} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className={inpCls}>
                {STATUS_FERRAMENTA.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Público-alvo">
              <input value={edit.publico_alvo ?? ""} onChange={(e) => setEdit({ ...edit, publico_alvo: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Segmento">
              <input value={edit.segmento ?? ""} onChange={(e) => setEdit({ ...edit, segmento: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Link de acesso" full>
              <input value={edit.link_acesso ?? ""} onChange={(e) => setEdit({ ...edit, link_acesso: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Responsável" full>
              <input value={edit.responsavel ?? ""} onChange={(e) => setEdit({ ...edit, responsavel: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Imagem de capa" full>
              <ImageUploadField
                folder="ferramentas"
                value={edit.imagem_url ?? null}
                onChange={(path) => setEdit({ ...edit, imagem_url: path })}
              />
            </Field>
          </div>
        </AdminFormShell>
      )}
    </div>
  );
}