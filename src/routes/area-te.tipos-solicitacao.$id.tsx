import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";

export const Route = createFileRoute("/area-te/tipos-solicitacao/$id")({
  component: TipoDetail,
});

const TIPOS_CAMPO = [
  { v: "text", l: "Texto curto" },
  { v: "textarea", l: "Texto longo" },
  { v: "email", l: "E-mail" },
  { v: "url", l: "URL" },
  { v: "number", l: "Número" },
  { v: "date", l: "Data" },
  { v: "select", l: "Seleção única" },
  { v: "multiselect", l: "Seleção múltipla" },
  { v: "checkbox", l: "Caixa de seleção" },
];

function slugifyKey(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
}

function TipoDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: tipo } = useQuery({
    queryKey: ["admin-tipo", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("solicitacao_tipos").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: campos = [] } = useQuery({
    queryKey: ["admin-tipo-campos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacao_campos")
        .select("*")
        .eq("tipo_id", id)
        .order("ordem");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [edit, setEdit] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: async (c: any) => {
      const payload: any = {
        tipo_id: id,
        label: c.label?.trim(),
        chave: (c.chave?.trim() || slugifyKey(c.label ?? "")),
        tipo_campo: c.tipo_campo ?? "text",
        obrigatorio: !!c.obrigatorio,
        placeholder: c.placeholder ?? null,
        help_text: c.help_text ?? null,
        ordem: Number(c.ordem ?? campos.length + 1),
        opcoes: c.opcoes
          ? (typeof c.opcoes === "string"
              ? c.opcoes.split("\n").map((s: string) => s.trim()).filter(Boolean)
              : c.opcoes)
          : [],
      };
      if (!payload.label) throw new Error("Rótulo obrigatório");
      if (c.id) {
        const { error } = await supabase.from("solicitacao_campos").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("solicitacao_campos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Campo salvo."); setEdit(null); qc.invalidateQueries({ queryKey: ["admin-tipo-campos", id] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  async function remove(cid: string) {
    if (!confirm("Excluir este campo?")) return;
    const { error } = await supabase.from("solicitacao_campos").delete().eq("id", cid);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-tipo-campos", id] });
  }

  async function move(c: any, dir: -1 | 1) {
    const other = campos[campos.indexOf(c) + dir];
    if (!other) return;
    await supabase.from("solicitacao_campos").update({ ordem: other.ordem }).eq("id", c.id);
    await supabase.from("solicitacao_campos").update({ ordem: c.ordem }).eq("id", other.id);
    qc.invalidateQueries({ queryKey: ["admin-tipo-campos", id] });
  }

  if (!tipo) return <p className="text-muted-foreground">Carregando…</p>;

  return (
    <div>
      <Link to="/area-te/tipos-solicitacao" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-3xl font-bold">{tipo.nome}</h1>
      <p className="text-muted-foreground mb-1">/{tipo.slug}</p>
      {tipo.descricao && <p className="text-sm text-muted-foreground mb-6">{tipo.descricao}</p>}

      <div className="flex items-center justify-between mb-3 mt-6">
        <h2 className="text-xl font-semibold">Campos do formulário</h2>
        <button onClick={() => setEdit({ tipo_campo: "text", obrigatorio: false, ordem: campos.length + 1 })}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm">
          <Plus className="h-4 w-4" /> Adicionar campo
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Esses campos são adicionais ao formulário base (nome, e-mail, unidade, título, descrição, urgência).
      </p>

      <div className="rounded-xl border bg-card divide-y">
        {campos.length === 0 && (
          <p className="p-6 text-center text-muted-foreground text-sm">Nenhum campo adicional.</p>
        )}
        {campos.map((c: any, idx: number) => (
          <div key={c.id} className="p-4 flex items-center gap-3">
            <div className="flex flex-col">
              <button disabled={idx === 0} onClick={() => move(c, -1)} className="p-0.5 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
              <button disabled={idx === campos.length - 1} onClick={() => move(c, 1)} className="p-0.5 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                {c.label} {c.obrigatorio && <span className="text-destructive">*</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-mono">{c.chave}</span> · {TIPOS_CAMPO.find((t) => t.v === c.tipo_campo)?.l ?? c.tipo_campo}
                {Array.isArray(c.opcoes) && c.opcoes.length > 0 && ` · ${c.opcoes.length} opções`}
              </div>
            </div>
            <button onClick={() => setEdit({ ...c, opcoes: Array.isArray(c.opcoes) ? (c.opcoes as string[]).join("\n") : "" })}
                    className="p-1.5 hover:bg-muted rounded"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(c.id)} className="p-1.5 hover:bg-muted rounded text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {edit && (
        <AdminFormShell title={edit.id ? "Editar campo" : "Novo campo"} onClose={() => setEdit(null)}
                        onSubmit={() => save.mutate(edit)} loading={save.isPending}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rótulo *" full>
              <input required value={edit.label ?? ""}
                     onChange={(e) => setEdit({ ...edit, label: e.target.value, chave: edit.id ? edit.chave : slugifyKey(e.target.value) })}
                     className={inpCls} />
            </Field>
            <Field label="Chave técnica *">
              <input required value={edit.chave ?? ""} onChange={(e) => setEdit({ ...edit, chave: slugifyKey(e.target.value) })} className={inpCls + " font-mono"} />
            </Field>
            <Field label="Tipo de campo">
              <select value={edit.tipo_campo ?? "text"} onChange={(e) => setEdit({ ...edit, tipo_campo: e.target.value })} className={inpCls}>
                {TIPOS_CAMPO.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </Field>
            <Field label="Placeholder">
              <input value={edit.placeholder ?? ""} onChange={(e) => setEdit({ ...edit, placeholder: e.target.value })} className={inpCls} />
            </Field>
            <Field label="Texto de ajuda">
              <input value={edit.help_text ?? ""} onChange={(e) => setEdit({ ...edit, help_text: e.target.value })} className={inpCls} />
            </Field>
            {["select", "multiselect"].includes(edit.tipo_campo) && (
              <Field label="Opções (uma por linha)" full>
                <textarea rows={4} value={edit.opcoes ?? ""} onChange={(e) => setEdit({ ...edit, opcoes: e.target.value })} className={inpCls} />
              </Field>
            )}
            <label className="flex items-center gap-2 text-sm col-span-2">
              <input type="checkbox" checked={!!edit.obrigatorio} onChange={(e) => setEdit({ ...edit, obrigatorio: e.target.checked })} />
              Campo obrigatório
            </label>
          </div>
        </AdminFormShell>
      )}
    </div>
  );
}