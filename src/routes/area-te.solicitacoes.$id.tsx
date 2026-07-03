import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import {
  badgeColorFromConfig,
  badgeStyleFromConfig,
} from "@/lib/portal-constants";
import {
  listPrioridadesSolicitacaoPublic,
  listStatusSolicitacaoPublic,
} from "@/lib/configuracoes.functions";
import {
  deleteSolicitacaoAdmin,
  getSolicitacaoAdmin,
  listEquipeTeOptions,
  updateSolicitacaoAdmin,
  listSolicitacaoHistoricoAdmin,
  addSolicitacaoComentarioAdmin,
} from "@/lib/solicitacoes.functions";

export const Route = createFileRoute("/area-te/solicitacoes/$id")({
  component: SolicDetail,
});

function SolicDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getSolicitacaoFn = useServerFn(getSolicitacaoAdmin);
  const listEquipeFn = useServerFn(listEquipeTeOptions);
  const updateSolicitacaoFn = useServerFn(updateSolicitacaoAdmin);
  const deleteSolicitacaoFn = useServerFn(deleteSolicitacaoAdmin);
  const listHistoricoFn = useServerFn(listSolicitacaoHistoricoAdmin);
  const addComentarioFn = useServerFn(addSolicitacaoComentarioAdmin);

  const listStatusFn = useServerFn(listStatusSolicitacaoPublic);
  const listPrioridadesFn = useServerFn(listPrioridadesSolicitacaoPublic);

  const { data, isLoading } = useQuery({
    queryKey: ["solic", id],
    queryFn: () =>
      getSolicitacaoFn({
        data: {
          id,
        },
      }),
  });

  const { data: historico = [] } = useQuery({
    queryKey: ["solic-historico", id],
    queryFn: () =>
      listHistoricoFn({
        data: {
          id,
        },
      }),
    enabled: !!data,
  });

  const { data: equipe = [] } = useQuery({
    queryKey: ["equipe-te-options"],
    queryFn: () => listEquipeFn(),
  });


  const { data: statusOptions = [] } = useQuery({
    queryKey: ["status-solicitacao"],
    queryFn: () => listStatusFn(),
  });

  const { data: prioridadeOptions = [] } = useQuery({
    queryKey: ["prioridades-solicitacao"],
    queryFn: () => listPrioridadesFn(),
  });

  const statusColorMap = new Map(statusOptions.map((s: any) => [s.nome, s.cor]));
  const prioridadeColorMap = new Map(prioridadeOptions.map((p: any) => [p.nome, p.cor]));

  const [status, setStatus] = useState("");
  const [urgencia, setUrgencia] = useState("");
  const [resp, setResp] = useState("");
  const [obs, setObs] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [comentario, setComentario] = useState("");

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data) {
      setStatus(data.status ?? "");
      setUrgencia(data.urgencia ?? "");
      setResp(data.responsavel_te ?? "");
      setObs(data.observacoes_internas ?? "");
      setResponsavelId(data.responsavel_id ?? "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await updateSolicitacaoFn({
        data: {
          id,
          status,
          urgencia,
          responsavel_te: resp,
          observacoes_internas: obs,
          responsavel_id: responsavelId || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Solicitação atualizada.");
      qc.invalidateQueries({ queryKey: ["solic", id] });
      qc.invalidateQueries({ queryKey: ["admin-solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["solic-historico", id] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Erro ao salvar.");
    },
  });

  const addComentario = useMutation({
    mutationFn: async () => {
      if (!comentario.trim()) {
        throw new Error("Informe um comentário.");
      }

      await addComentarioFn({
        data: {
          id,
          comentario,
        },
      });
    },
    onSuccess: () => {
      toast.success("Comentário registrado.");
      setComentario("");
      qc.invalidateQueries({ queryKey: ["solic-historico", id] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Erro ao registrar comentário.");
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      await deleteSolicitacaoFn({
        data: {
          id,
        },
      });
    },
    onSuccess: () => {
      toast.success("Excluída.");
      qc.invalidateQueries({ queryKey: ["admin-solicitacoes"] });
      navigate({ to: "/area-te/solicitacoes" });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Erro ao excluir.");
    },
  });

  const historicoList = Array.isArray(historico) ? historico : [];

  const acompanhamentos = historicoList
    .filter((h: any) => h.tipo === "comentario")
    .sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  const eventos = historicoList
    .filter((h: any) => h.tipo !== "comentario")
    .sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  useEffect(() => {
    const el = chatScrollRef.current;

    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [acompanhamentos.length]);

  useEffect(() => {
    const el = timelineScrollRef.current;

    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [eventos.length]);

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;

  if (!data) {
    return (
      <div>
        <p className="text-muted-foreground">Solicitação não encontrada.</p>
        <Link to="/area-te/solicitacoes" className="text-primary hover:underline text-sm">
          Voltar
        </Link>
      </div>
    );
  }

  const F = ({ l, v }: { l: string; v: any }) =>
    v ? (
      <div>
        <div className="text-xs text-muted-foreground">{l}</div>
        <div className="font-medium">{v}</div>
      </div>
    ) : null;



  const formatDateTime = (value: any) => {
    if (!value) return "";

    return new Date(value).toLocaleString("pt-BR");
  };

  const historicoStyle = (tipo: string | null | undefined) => {
    switch (tipo) {
      case "criacao":
        return {
          label: "Criação",
          className: "border-l-green-500 bg-green-500/5",
        };

      case "comentario":
        return {
          label: "Comentário",
          className: "border-l-blue-500 bg-blue-500/5",
        };

      case "status":
        return {
          label: "Status",
          className: "border-l-orange-500 bg-orange-500/5",
        };

      case "urgencia":
        return {
          label: "Urgência",
          className: "border-l-red-500 bg-red-500/5",
        };

      case "responsavel":
        return {
          label: "Responsável",
          className: "border-l-purple-500 bg-purple-500/5",
        };

      default:
        return {
          label: "Histórico",
          className: "border-l-muted bg-muted/40",
        };
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/area-te/solicitacoes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para solicitações
      </Link>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Solicitação
            </div>

            <h1 className="text-2xl font-bold leading-tight">{data.titulo}</h1>

            <p className="text-sm text-muted-foreground">
              Aberta em {formatDateTime(data.created_at)} por{" "}
              <span className="font-medium text-foreground">{data.nome_solicitante}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeColorFromConfig(
                statusColorMap.get(data.status) as string | null,
              )}`}
              style={badgeStyleFromConfig(statusColorMap.get(data.status) as string | null)}
            >
              {data.status}
            </span>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeColorFromConfig(
                prioridadeColorMap.get(data.urgencia) as string | null,
              )}`}
              style={badgeStyleFromConfig(prioridadeColorMap.get(data.urgencia) as string | null)}
            >
              {data.urgencia}
            </span>

            <span className="px-2.5 py-1 rounded-full border bg-background text-xs font-medium">
              {data.tipo_solicitacao}
            </span>

            <span className="px-2.5 py-1 rounded-full border bg-background text-xs font-medium">
              {data.unidade}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-6">
          <section className="flex h-[720px] max-h-[calc(100vh-180px)] min-h-[560px] flex-col rounded-xl border bg-card">
            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">Chat da solicitação</h2>
              <p className="text-sm text-muted-foreground">
                Registre acompanhamentos internos em formato de conversa.
              </p>
            </div>

            <div
              ref={chatScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20 p-5"
            >
              {acompanhamentos.length === 0 ? (
                <div className="flex min-h-full items-center justify-center rounded-lg border border-dashed bg-background/60 p-6 text-center">
                  <div>
                    <p className="text-sm font-medium">Nenhuma mensagem registrada.</p>
                    <p className="text-sm text-muted-foreground">
                      Use o campo abaixo para iniciar o acompanhamento interno da solicitação.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {acompanhamentos.map((h: any) => {
                    const authorName = h.autor_nome ?? "Tecnologia Educacional";

                    return (
                      <article key={h.id} className="flex items-start gap-3">
                        <UserAvatar
                          path={h.autor_avatar_url}
                          name={authorName}
                          size={38}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(h.created_at)}
                            </span>
                          </div>

                          <div className="max-w-[820px] rounded-2xl rounded-tl-sm border bg-background px-4 py-3 shadow-sm">
                            {h.descricao && (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                {h.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t bg-card p-4">
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Digite uma mensagem de acompanhamento interno..."
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => addComentario.mutate()}
                    disabled={addComentario.isPending || !comentario.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {addComentario.isPending ? "Enviando..." : "Enviar mensagem"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Gestão interna</h2>


            {data.responsavel && (
              <div className="mb-4 rounded-lg bg-muted p-4 text-center text-sm">
                <div className="mb-3 text-xs font-medium text-muted-foreground">
                  Responsável atual
                </div>

                <div className="flex flex-col items-center">
                  <UserAvatar
                    path={data.responsavel.avatar_url}
                    name={data.responsavel.nome_completo}
                    size={64}
                    className="mb-3"
                  />

                  <div className="font-semibold">{data.responsavel.nome_completo}</div>
                  <div className="text-xs text-muted-foreground">{data.responsavel.email}</div>
                </div>
              </div>
            )}

            <label className="block mb-3">
              <span className="text-sm font-medium">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
              >
                {statusOptions.map((s: any) => (
                  <option key={s.id} value={s.nome}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block mb-3">
              <span className="text-sm font-medium">Urgência</span>
              <select
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
              >
                {prioridadeOptions.map((u: any) => (
                  <option key={u.id} value={u.nome}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block mb-3">
              <span className="text-sm font-medium">Responsável</span>
              <select
                value={responsavelId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selected = equipe.find((p: any) => p.id === selectedId);

                  setResponsavelId(selectedId);
                  setResp(selected?.nome_completo || selected?.email || "");
                }}
                className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="">— Não atribuído</option>
                {equipe.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_completo || p.email || p.id}
                  </option>
                ))}
              </select>
            </label>

            {!responsavelId && (
              <label className="block mb-3">
                <span className="text-sm font-medium">Responsável legado</span>
                <input
                  value={resp}
                  onChange={(e) => setResp(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
                />
              </label>
            )}

            <label className="block mb-4">
              <span className="text-sm font-medium">Observações internas</span>
              <textarea
                rows={5}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </label>

            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {save.isPending ? "Salvando..." : "Salvar alterações"}
            </button>

            <button
              onClick={() => {
                if (!confirm("Excluir esta solicitação?")) return;
                remove.mutate();
              }}
              disabled={remove.isPending}
              className="w-full mt-3 text-sm text-destructive hover:underline disabled:opacity-50"
            >
              Excluir solicitação
            </button>
          </section>

          <section className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Solicitante</h2>

            <div className="space-y-3 text-sm">
              <F l="Nome" v={data.nome_solicitante} />
              <F l="E-mail" v={data.email_solicitante} />
              <F l="Unidade" v={data.unidade} />
              <F l="Segmento / Área" v={data.segmento_area} />
              <F l="Cargo / Função" v={data.cargo_funcao} />
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Detalhes da solicitação</h2>

            <div className="space-y-3 text-sm">
              <F l="Tipo" v={data.tipo_solicitacao} />
              <F l="Urgência" v={data.urgencia} />
              <F l="Público impactado" v={data.publico_impactado} />
              <F l="Unidades impactadas" v={data.unidades_impactadas} />

              <F
                l="Prazo desejado"
                v={
                  data.prazo_desejado
                    ? new Date(data.prazo_desejado).toLocaleDateString("pt-BR")
                    : null
                }
              />

              <F
                l="Link"
                v={
                  data.link_referencia ? (
                    <a
                      href={data.link_referencia}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {data.link_referencia}
                    </a>
                  ) : null
                }
              />
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Descrição</h2>

            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {data.descricao}
            </p>

            {data.observacoes_adicionais && (
              <div className="mt-4 border-t pt-4">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Observações adicionais
                </div>
                <p className="whitespace-pre-wrap text-sm">
                  {data.observacoes_adicionais}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-card p-6">
            <div className="mb-4">
              <h2 className="font-semibold">Timeline do chamado</h2>
              <p className="text-sm text-muted-foreground">
                Eventos automáticos do ciclo da solicitação.
              </p>
            </div>

            {eventos.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center">
                <p className="text-sm font-medium">Nenhum evento registrado.</p>
                <p className="text-xs text-muted-foreground">
                  Alterações de status, urgência e responsável aparecerão aqui.
                </p>
              </div>
            ) : (
              <div
                ref={timelineScrollRef}
                className="max-h-[420px] space-y-3 overflow-y-auto overscroll-contain pr-1"
              >
                {eventos.map((h: any) => {
                  const style = historicoStyle(h.tipo);

                  return (
                    <article
                      key={h.id}
                      className={`rounded-lg border border-l-4 p-3 text-sm ${style.className}`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{h.titulo}</div>

                        <span className="shrink-0 rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                          {style.label}
                        </span>
                      </div>

                      {h.descricao && (
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {h.descricao}
                        </p>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(h.created_at)}
                        {h.autor_nome ? ` · ${h.autor_nome}` : ""}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {data.respostas && Object.keys(data.respostas).length > 0 && (
            <section className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold mb-4">Respostas específicas</h2>

              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto">
                {JSON.stringify(data.respostas, null, 2)}
              </pre>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}