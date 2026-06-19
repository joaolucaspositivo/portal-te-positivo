import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { UNIDADES, TIPOS_SOLICITACAO, URGENCIAS } from "@/lib/portal-constants";

export const Route = createFileRoute("/solicitacoes")({
  head: () => ({
    meta: [
      { title: "Solicitações — Portal TE" },
      { name: "description", content: "Abra uma solicitação para a equipe de Tecnologia Educacional." },
    ],
  }),
  component: SolicitacoesPage,
});

type Form = {
  nome_solicitante: string; email_solicitante: string; unidade: string;
  segmento_area: string; cargo_funcao: string;
  tipo_solicitacao: string; titulo: string; descricao: string;
  publico_impactado: string; unidades_impactadas: string;
  prazo_desejado: string; urgencia: string;
  link_referencia: string; observacoes_adicionais: string;
};

const initial: Form = {
  nome_solicitante: "", email_solicitante: "", unidade: "",
  segmento_area: "", cargo_funcao: "",
  tipo_solicitacao: "", titulo: "", descricao: "",
  publico_impactado: "", unidades_impactadas: "",
  prazo_desejado: "", urgencia: "Média",
  link_referencia: "", observacoes_adicionais: "",
};

function SolicitacoesPage() {
  const [form, setForm] = useState<Form>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof Form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome_solicitante || !form.email_solicitante || !form.unidade ||
        !form.tipo_solicitacao || !form.titulo || !form.descricao) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      prazo_desejado: form.prazo_desejado || null,
      status: "Recebida",
    };
    const { error } = await supabase.from("solicitacoes").insert(payload);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar a solicitação.");
      return;
    }
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-muted/40 border-b">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold">Solicitações</h1>
            <p className="mt-3 text-muted-foreground max-w-3xl">
              Use este formulário para registrar solicitações relacionadas à Tecnologia Educacional.
              A equipe TE analisará a demanda e fará o encaminhamento conforme a priorização interna.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 max-w-3xl">
          {submitted ? (
            <div className="rounded-xl border-2 border-primary bg-card p-10 text-center">
              <CheckCircle2 className="h-14 w-14 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Solicitação enviada com sucesso</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A equipe de Tecnologia Educacional fará a análise da demanda e retornará conforme priorização interna.
              </p>
              <button
                onClick={() => { setForm(initial); setSubmitted(false); }}
                className="mt-6 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium"
              >
                Abrir nova solicitação
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-8">
              <Fieldset title="Dados do solicitante">
                <Field label="Nome completo *">
                  <input required value={form.nome_solicitante}
                         onChange={(e) => set("nome_solicitante", e.target.value)} className="inp" />
                </Field>
                <Field label="E-mail institucional *">
                  <input type="email" required value={form.email_solicitante}
                         onChange={(e) => set("email_solicitante", e.target.value)} className="inp" />
                </Field>
                <Field label="Unidade *">
                  <select required value={form.unidade}
                          onChange={(e) => set("unidade", e.target.value)} className="inp">
                    <option value="">Selecione…</option>
                    {UNIDADES.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </Field>
                <Field label="Segmento ou área">
                  <input value={form.segmento_area}
                         onChange={(e) => set("segmento_area", e.target.value)} className="inp" />
                </Field>
                <Field label="Cargo ou função">
                  <input value={form.cargo_funcao}
                         onChange={(e) => set("cargo_funcao", e.target.value)} className="inp" />
                </Field>
              </Fieldset>

              <Fieldset title="Dados da solicitação">
                <Field label="Tipo de solicitação *">
                  <select required value={form.tipo_solicitacao}
                          onChange={(e) => set("tipo_solicitacao", e.target.value)} className="inp">
                    <option value="">Selecione…</option>
                    {TIPOS_SOLICITACAO.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Título da solicitação *">
                  <input required value={form.titulo}
                         onChange={(e) => set("titulo", e.target.value)} className="inp" />
                </Field>
                <Field label="Descrição detalhada *" full>
                  <textarea required rows={5} value={form.descricao}
                            onChange={(e) => set("descricao", e.target.value)} className="inp" />
                </Field>
                <Field label="Público impactado">
                  <input value={form.publico_impactado}
                         onChange={(e) => set("publico_impactado", e.target.value)} className="inp" />
                </Field>
                <Field label="Unidade(s) impactada(s)">
                  <input value={form.unidades_impactadas}
                         onChange={(e) => set("unidades_impactadas", e.target.value)} className="inp" />
                </Field>
                <Field label="Prazo desejado">
                  <input type="date" value={form.prazo_desejado}
                         onChange={(e) => set("prazo_desejado", e.target.value)} className="inp" />
                </Field>
                <Field label="Grau de urgência">
                  <select value={form.urgencia}
                          onChange={(e) => set("urgencia", e.target.value)} className="inp">
                    {URGENCIAS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </Field>
                <Field label="Link de referência" full>
                  <input value={form.link_referencia}
                         onChange={(e) => set("link_referencia", e.target.value)} className="inp"
                         placeholder="https://…" />
                </Field>
                <Field label="Observações adicionais" full>
                  <textarea rows={3} value={form.observacoes_adicionais}
                            onChange={(e) => set("observacoes_adicionais", e.target.value)} className="inp" />
                </Field>
              </Fieldset>

              <div className="flex items-center justify-end gap-3">
                <button type="submit" disabled={loading}
                        className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50">
                  {loading ? "Enviando…" : "Enviar solicitação"}
                </button>
              </div>

              <style>{`.inp{width:100%;padding:.55rem .75rem;border:1px solid var(--border);border-radius:.5rem;background:var(--background);font-size:.9rem}`}</style>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}