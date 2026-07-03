import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";
import { listCategoriasComunicadoPublic } from "@/lib/configuracoes.functions";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ImageUploadField } from "@/components/image-upload-field";
import {
  deleteComunicadoAdmin,
  listComunicadosAdmin,
  saveComunicadoAdmin,
} from "@/lib/conteudo.functions";

export const Route = createFileRoute("/area-te/comunicados")({
  component: AdminComunicados,
});

type C = Partial<{
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: string;
  autor: string;
  data_publicacao: string;
  destaque: boolean;
  publicado: boolean;
  imagem_url: string | null;
}>;

const empty: C = {
  titulo: "",
  conteudo: "",
  publicado: true,
  destaque: false,
  data_publicacao: new Date().toISOString().slice(0, 10),
};

function toDateInput(value: any) {
  if (!value) return new Date().toISOString().slice(0, 10);

  return new Date(value).toISOString().slice(0, 10);
}

function AdminComunicados() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<C | null>(null);

  const listComunicadosFn = useServerFn(listComunicadosAdmin);
  const saveComunicadoFn = useServerFn(saveComunicadoAdmin);
  const deleteComunicadoFn = useServerFn(deleteComunicadoAdmin);

  const listCategoriasFn = useServerFn(listCategoriasComunicadoPublic);

  const { data = [] } = useQuery({
    queryKey: ["admin-comunicados"],
    queryFn: () => listComunicadosFn(),
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-comunicado"],
    queryFn: () => listCategoriasFn(),
  });

  const save = useMutation({
    mutationFn: async (c: C) => {
      if (!c.titulo?.trim() || !c.conteudo?.trim()) {
        throw new Error("Título e conteúdo obrigatórios");
      }

      await saveComunicadoFn({
        data: {
          id: c.id,
          titulo: c.titulo,
          resumo: c.resumo ?? null,
          conteudo: c.conteudo,
          categoria: c.categoria ?? null,
          autor: c.autor ?? null,
          data_publicacao: c.data_publicacao ?? new Date().toISOString().slice(0, 10),
          destaque: !!c.destaque,
          publicado: c.publicado ?? true,
          imagem_url: c.imagem_url ?? null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Salvo.");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["admin-comunicados"] });
      qc.invalidateQueries({ queryKey: ["comunicados-public"] });
      qc.invalidateQueries({ queryKey: ["home-comunicados"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await deleteComunicadoFn({
        data: {
          id,
        },
      });
    },
    onSuccess: () => {
      toast.success("Excluído.");
      qc.invalidateQueries({ queryKey: ["admin-comunicados"] });
      qc.invalidateQueries({ queryKey: ["comunicados-public"] });
      qc.invalidateQueries({ queryKey: ["home-comunicados"] });
    },
    onError: () => toast.error("Erro."),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Comunicados</h1>
          <p className="text-muted-foreground">{data.length} cadastrados</p>
        </div>

        <button
          onClick={() => setEdit({ ...empty })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium"
        >
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Título</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Data</th>
              <th className="p-3">Publicado</th>
              <th className="p-3">Destaque</th>
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Nenhum comunicado.
                </td>
              </tr>
            ) : (
              data.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.titulo}</td>
                  <td className="p-3">{c.categoria}</td>
                  <td className="p-3">
                    {new Date(c.data_publicacao).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-3">{c.publicado ? "Sim" : "Não"}</td>
                  <td className="p-3">
                    {c.destaque ? <Star className="h-4 w-4 text-primary fill-current" /> : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setEdit({ ...c, data_publicacao: toDateInput(c.data_publicacao) })}
                      className="p-1.5 hover:bg-muted rounded mr-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => remove.mutate(c.id)}
                      className="p-1.5 hover:bg-muted rounded text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {edit && (
        <AdminFormShell
          title={edit.id ? "Editar comunicado" : "Novo comunicado"}
          onClose={() => setEdit(null)}
          onSubmit={() => save.mutate(edit)}
          loading={save.isPending}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Título *" full>
              <input
                required
                value={edit.titulo ?? ""}
                onChange={(e) => setEdit({ ...edit, titulo: e.target.value })}
                className={inpCls}
              />
            </Field>

            <Field label="Resumo" full>
              <textarea
                rows={2}
                value={edit.resumo ?? ""}
                onChange={(e) => setEdit({ ...edit, resumo: e.target.value })}
                className={inpCls}
              />
            </Field>

            <Field label="Conteúdo *" full>
              <RichTextEditor
                value={edit.conteudo ?? ""}
                onChange={(html) => setEdit({ ...edit, conteudo: html })}
                placeholder="Escreva o comunicado. Use os botões para títulos, negrito, listas e links."
              />
            </Field>

            <Field label="Imagem de capa" full>
              <ImageUploadField
                folder="comunicados"
                value={edit.imagem_url ?? null}
                onChange={(path) => setEdit({ ...edit, imagem_url: path })}
              />
            </Field>

            <Field label="Categoria">
              <select
                value={edit.categoria ?? ""}
                onChange={(e) => setEdit({ ...edit, categoria: e.target.value })}
                className={inpCls}
              >
                <option value="">—</option>
                {categorias.map((c: any) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Autor">
              <input
                value={edit.autor ?? ""}
                onChange={(e) => setEdit({ ...edit, autor: e.target.value })}
                className={inpCls}
              />
            </Field>

            <Field label="Data de publicação">
              <input
                type="date"
                value={edit.data_publicacao ?? ""}
                onChange={(e) => setEdit({ ...edit, data_publicacao: e.target.value })}
                className={inpCls}
              />
            </Field>

            <div className="flex gap-4 items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!edit.publicado}
                  onChange={(e) => setEdit({ ...edit, publicado: e.target.checked })}
                />
                Publicado
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!edit.destaque}
                  onChange={(e) => setEdit({ ...edit, destaque: e.target.checked })}
                />
                Destaque
              </label>
            </div>
          </div>
        </AdminFormShell>
      )}
    </div>
  );
}