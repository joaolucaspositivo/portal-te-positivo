import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listPrioridadesSolicitacaoPublic } from "@/lib/configuracoes.functions";
import { DynamicFormFields, type DynamicField } from "@/components/dynamic-form";
import { useAuth } from "@/lib/use-auth";
import { listMinhasUnidades, listUnidadesPublicas } from "@/lib/unidades.functions";
import {
  createSolicitacaoPublic,
  getSolicitacaoTipoPublic,
  listCamposSolicitacaoPublic,
} from "@/lib/solicitacoes.functions";

export const Route = createFileRoute("/solicitacoes/$slug")({
  component: SolicSlug,
});

type Base = {
  nome_solicitante: string;
  email_solicitante: string;
  unidade: string;
  unidade_id: string | null;
  cargo_funcao: string;
  titulo: string;
  descricao: string;
  urgencia: string;
};

const inp = "w-full px-3 py-2 rounded-md border bg-background text-sm";

function SolicSlug() {
  const { slug } = Route.useParams();

  const { user, profile } = useAuth();

  const minhasUnidadesFn = useServerFn(listMinhasUnidades);
  const unidadesPublicasFn = useServerFn(listUnidadesPublicas);
  const getTipoFn = useServerFn(getSolicitacaoTipoPublic);
  const listCamposFn = useServerFn(listCamposSolicitacaoPublic);
  const createSolicitacaoFn = useServerFn(createSolicitacaoPublic);

  const listPrioridadesFn = useServerFn(listPrioridadesSolicitacaoPublic);

  const { data: minhasUnidades = [] } = useQuery({
    enabled: !!user,
    queryKey: ["minhas-unidades", user?.id],
    queryFn: () => minhasUnidadesFn(),
  });

  const { data: unidadesPublicas = [] } = useQuery({
    queryKey: ["unidades-publicas"],
    queryFn: () => unidadesPublicasFn(),
  });

  const { data: tipo, isLoading: tipoLoading } = useQuery({
    queryKey: ["public-tipo", slug],
    queryFn: () =>
      getTipoFn({
        data: {
          slug,
        },
      }),
  });

  const { data: campos = [] } = useQuery({
    enabled: !!tipo,
    queryKey: ["public-campos", tipo?.id],
    queryFn: () =>
      listCamposFn({
        data: {
          tipoId: tipo!.id,
        },
      }),
  });

  const { data: prioridadeOptions = [] } = useQuery({
    queryKey: ["prioridades-solicitacao"],
    queryFn: () => listPrioridadesFn(),
  });

  const [base, setBase] = useState<Base>({
    nome_solicitante: "",
    email_solicitante: "",
    unidade: "",
    unidade_id: null,
    cargo_funcao: "",
    titulo: "",
    descricao: "",
    urgencia: "",
  });

  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const unidadesDisponiveis =
    minhasUnidades.length > 0
      ? minhasUnidades.map((u: any) => ({
        id: u.unidade_id,
        nome: u.nome,
        sigla: u.sigla,
      }))
      : unidadesPublicas.map((u: any) => ({
        id: u.id,
        nome: u.nome,
        sigla: u.sigla,
      }));

  useEffect(() => {
    if (user && profile) {
      setBase((b) => ({
        ...b,
        nome_solicitante: b.nome_solicitante || profile.nome_completo || "",
        email_solicitante: b.email_solicitante || user.email || "",
        unidade: b.unidade || profile.unidade || "",
        cargo_funcao: b.cargo_funcao || profile.cargo || "",
      }));
    }
  }, [user, profile]);

  useEffect(() => {
    if (minhasUnidades.length > 0) {
      const principal = minhasUnidades.find((u: any) => u.principal) ?? minhasUnidades[0];

      setBase((b) => ({
        ...b,
        unidade_id: b.unidade_id ?? principal.unidade_id,
        unidade: b.unidade || principal.nome,
      }));
    }
  }, [minhasUnidades]);

  useEffect(() => {
    if (base.unidade_id || unidadesDisponiveis.length === 0) return;

    const primeira = unidadesDisponiveis[0];

    setBase((b) => ({
      ...b,
      unidade_id: primeira.id,
      unidade: primeira.nome,
    }));
  }, [base.unidade_id, unidadesDisponiveis]);

  useEffect(() => {
    if (base.urgencia || prioridadeOptions.length === 0) return;

    const padrao =
      prioridadeOptions.find((p: any) => p.padrao) ?? prioridadeOptions[0];

    setBase((b) => ({
      ...b,
      urgencia: padrao?.nome ?? "Média",
    }));
  }, [base.urgencia, prioridadeOptions]);

  if (tipoLoading) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Carregando…</p>
      </PageShell>
    );
  }

  if (!tipo) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Tipo de solicitação não encontrado.</p>
        <Link to="/solicitacoes" className="text-primary hover:underline text-sm">
          Voltar
        </Link>
      </PageShell>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!tipo) return;

    if (
      !base.nome_solicitante ||
      !base.email_solicitante ||
      !base.unidade ||
      !base.titulo ||
      !base.descricao
    ) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    for (const f of campos as DynamicField[]) {
      if (f.obrigatorio && (respostas[f.chave] == null || respostas[f.chave] === "")) {
        toast.error(`Campo obrigatório: ${f.label}`);
        return;
      }
    }

    if (!tipo.permite_anonimo && !user) {
      toast.error("É necessário entrar para abrir este tipo de solicitação.");
      return;
    }

    setLoading(true);

    try {
      await createSolicitacaoFn({
        data: {
          tipoId: tipo.id,
          ...base,
          urgencia: base.urgencia || "Média",
          respostas,
        },
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      toast.error(error?.message ?? "Não foi possível enviar a solicitação.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <PageShell>
        <div className="rounded-xl border-2 border-primary bg-card p-10 text-center max-w-2xl mx-auto">
          <CheckCircle2 className="h-14 w-14 mx-auto text-primary mb-4" />

          <h2 className="text-2xl font-bold mb-2">Solicitação enviada</h2>

          <p className="text-muted-foreground max-w-xl mx-auto">
            A equipe de Tecnologia Educacional analisará a demanda e retornará conforme priorização
            interna.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setRespostas({});
                setBase({ ...base, titulo: "", descricao: "" });
                setSubmitted(false);
              }}
              className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium"
            >
              Abrir outra do mesmo tipo
            </button>

            <Link to="/solicitacoes" className="px-5 py-2 rounded-md border font-medium">
              Ver outros tipos
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link
        to="/solicitacoes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos tipos
      </Link>

      <h1 className="text-3xl font-bold">{tipo.nome}</h1>

      {tipo.descricao && (
        <p className="text-muted-foreground mt-1 mb-6 max-w-3xl">{tipo.descricao}</p>
      )}

      {!tipo.permite_anonimo && !user && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
          Este tipo de solicitação exige que você esteja logado.{" "}
          <Link to="/auth" className="font-medium underline">
            Entrar
          </Link>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
        <Section title="Seus dados">
          <FieldLabel label="Nome completo *">
            <input
              required
              value={base.nome_solicitante}
              onChange={(e) => setBase({ ...base, nome_solicitante: e.target.value })}
              className={inp}
            />
          </FieldLabel>

          <FieldLabel label="E-mail institucional *">
            <input
              type="email"
              required
              value={base.email_solicitante}
              onChange={(e) => setBase({ ...base, email_solicitante: e.target.value })}
              className={inp}
            />
          </FieldLabel>

          <FieldLabel label="Unidade *">
            <select
              required
              value={base.unidade_id ?? ""}
              onChange={(e) => {
                const selected = unidadesDisponiveis.find((x: any) => x.id === e.target.value);

                setBase({
                  ...base,
                  unidade_id: selected?.id ?? null,
                  unidade: selected?.nome ?? "",
                });
              }}
              className={inp}
              disabled={unidadesDisponiveis.length === 0}
            >
              <option value="">Selecione…</option>
              {unidadesDisponiveis.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.sigla ? `${u.nome} (${u.sigla})` : u.nome}
                </option>
              ))}
            </select>

            {unidadesDisponiveis.length === 0 && (
              <span className="text-xs text-muted-foreground">
                Nenhuma unidade ativa cadastrada.
              </span>
            )}
          </FieldLabel>

          <FieldLabel label="Cargo / função">
            <input
              value={base.cargo_funcao}
              onChange={(e) => setBase({ ...base, cargo_funcao: e.target.value })}
              className={inp}
            />
          </FieldLabel>
        </Section>

        <Section title="Sobre a solicitação">
          <FieldLabel label="Título *" full>
            <input
              required
              value={base.titulo}
              onChange={(e) => setBase({ ...base, titulo: e.target.value })}
              className={inp}
            />
          </FieldLabel>

          <FieldLabel label="Descrição detalhada *" full>
            <textarea
              required
              rows={5}
              value={base.descricao}
              onChange={(e) => setBase({ ...base, descricao: e.target.value })}
              className={inp}
            />
          </FieldLabel>

          <FieldLabel label="Grau de urgência">
            <select
              value={base.urgencia}
              onChange={(e) => setBase({ ...base, urgencia: e.target.value })}
              className={inp}
            >
              {prioridadeOptions.map((u: any) => (
                <option key={u.id} value={u.nome}>
                  {u.nome}
                </option>
              ))}
            </select>
          </FieldLabel>
        </Section>

        {campos.length > 0 && (
          <Section title="Informações específicas">
            <DynamicFormFields
              fields={campos as DynamicField[]}
              values={respostas}
              onChange={(k, v) => setRespostas((r) => ({ ...r, [k]: v }))}
            />
          </Section>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Enviar solicitação"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function FieldLabel({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}