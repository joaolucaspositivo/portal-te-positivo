import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";
import { TIPOS_CONTATO } from "@/lib/portal-constants";
import { listUnidadesPublicas } from "@/lib/unidades.functions";
import {
  deleteContatoAdmin,
  listContatosAdmin,
  listProfileOptionsAdmin,
  saveContatoAdmin,
} from "@/lib/conteudo.functions";

export const Route = createFileRoute("/area-te/contatos")({
  component: AdminContatos,
});

type C = Partial<{
  id: string;
  nome: string;
  funcao: string;
  unidade: string;
  email: string;
  telefone_whatsapp: string;
  tipo_contato: string;
  ativo: boolean;
  user_id: string | null;
}>;

const empty: C = { nome: "", ativo: true };

function AdminContatos() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<C | null>(null);

  const listContatosFn = useServerFn(listContatosAdmin);
  const listProfilesFn = useServerFn(listProfileOptionsAdmin);
  const listUnidadesFn = useServerFn(listUnidadesPublicas);
  const saveContatoFn = useServerFn(saveContatoAdmin);
  const deleteContatoFn = useServerFn(deleteContatoAdmin);

  const { data = [] } = useQuery({
    queryKey: ["admin-contatos"],
    queryFn: () => listContatosFn(),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-options"],
    queryFn: () => listProfilesFn(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-publicas"],
    queryFn: () => listUnidadesFn(),
  });

  const save = useMutation({
    mutationFn: async (c: C) => {
      if (!c.nome?.trim()) throw new Error("Nome obrigatório");

      await saveContatoFn({
        data: {
          id: c.id,
          user_id: c.user_id ?? null,
          nome: c.nome,
          funcao: c.funcao ?? null,
          unidade: c.unidade ?? null,
          email: c.email ?? null,
          telefone_whatsapp: c.telefone_whatsapp ?? null,
          tipo_contato: c.tipo_contato ?? null,
          ativo: c.ativo ?? true,
        },
      });
    },
    onSuccess: () => {
      toast.success("Salvo.");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["admin-contatos"] });
      qc.invalidateQueries({ queryKey: ["contatos-public"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await deleteContatoFn({
        data: {
          id,
        },
      });
    },
    onSuccess: () => {
      toast.success("Excluído.");
      qc.invalidateQueries({ queryKey: ["admin-contatos"] });
      qc.invalidateQueries({ queryKey: ["contatos-public"] });
    },
    onError: () => toast.error("Erro."),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contatos</h1>
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
              <th className="p-3">Nome</th>
              <th className="p-3">Função</th>
              <th className="p-3">Unidade</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Ativo</th>
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Nenhum contato.
                </td>
              </tr>
            ) : (
              data.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.nome}</td>
                  <td className="p-3">{c.funcao}</td>
                  <td className="p-3">{c.unidade}</td>
                  <td className="p-3">{c.tipo_contato}</td>
                  <td className="p-3">{c.ativo ? "Sim" : "Não"}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setEdit(c)}
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
          title={edit.id ? "Editar contato" : "Novo contato"}
          onClose={() => setEdit(null)}
          onSubmit={() => save.mutate(edit)}
          loading={save.isPending}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome *" full>
              <input
                required
                value={edit.nome ?? ""}
                onChange={(e) => setEdit({ ...edit, nome: e.target.value })}
                className={inpCls}
              />
            </Field>

            <Field label="Função">
              <input
                value={edit.funcao ?? ""}
                onChange={(e) => setEdit({ ...edit, funcao: e.target.value })}
                className={inpCls}
              />
            </Field>

            <select
              value={edit.unidade ?? ""}
              onChange={(e) => setEdit({ ...edit, unidade: e.target.value })}
              className={inpCls}
              disabled={unidades.length === 0}
            >
              <option value="">—</option>
              {unidades.map((u: any) => (
                <option key={u.id} value={u.nome}>
                  {u.sigla ? `${u.nome} (${u.sigla})` : u.nome}
                </option>
              ))}
            </select>

            {unidades.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Nenhuma unidade ativa cadastrada.
              </p>
            )}

            <Field label="E-mail">
              <input
                type="email"
                value={edit.email ?? ""}
                onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                className={inpCls}
              />
            </Field>

            <Field label="Telefone / WhatsApp">
              <input
                value={edit.telefone_whatsapp ?? ""}
                onChange={(e) => setEdit({ ...edit, telefone_whatsapp: e.target.value })}
                className={inpCls}
              />
            </Field>

            <Field label="Tipo de contato" full>
              <select
                value={edit.tipo_contato ?? ""}
                onChange={(e) => setEdit({ ...edit, tipo_contato: e.target.value })}
                className={inpCls}
              >
                <option value="">—</option>
                {TIPOS_CONTATO.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </Field>

            <Field label="Vincular a um usuário do sistema" full>
              <select
                value={edit.user_id ?? ""}
                onChange={(e) => setEdit({ ...edit, user_id: e.target.value || null })}
                className={inpCls}
              >
                <option value="">— Nenhum (contato externo)</option>
                {profiles.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_completo || p.id}
                    {p.unidade ? ` · ${p.unidade}` : ""}
                  </option>
                ))}
              </select>

              <p className="text-xs text-muted-foreground mt-1">
                Quando vinculado, a foto de perfil do usuário aparece no card.
              </p>
            </Field>

            <label className="flex items-center gap-2 text-sm col-span-2">
              <input
                type="checkbox"
                checked={!!edit.ativo}
                onChange={(e) => setEdit({ ...edit, ativo: e.target.checked })}
              />
              Ativo (visível no portal público)
            </label>
          </div>
        </AdminFormShell>
      )}
    </div>
  );
}