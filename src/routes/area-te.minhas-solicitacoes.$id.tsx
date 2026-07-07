import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Inbox } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import {
  addMinhaSolicitacaoComentario,
  getMinhaSolicitacao,
  listMinhaSolicitacaoHistorico,
} from "@/lib/solicitacoes.functions";

export const Route = createFileRoute("/area-te/minhas-solicitacoes/$id")({
  component: MinhaSolicitacaoDetalhePage,
});

function MinhaSolicitacaoDetalhePage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();

  const qc = useQueryClient();
  const [comentario, setComentario] = useState("");

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  const getFn = useServerFn(getMinhaSolicitacao);
  const historicoFn = useServerFn(listMinhaSolicitacaoHistorico);

  const addComentarioFn = useServerFn(addMinhaSolicitacaoComentario);

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["minha-solicitacao", id],
    queryFn: () =>
      getFn({
        data: {
          id,
        },
      }),
  });

  const { data: historico = [] } = useQuery({
    enabled: !!user && !!data,
    queryKey: ["minha-solicitacao-historico", id],
    queryFn: () =>
      historicoFn({
        data: {
          id,
        },
      }),
  });

  const addComentario = useMutation({
    mutationFn: async () => {
      if (!comentario.trim()) {
        throw new Error("Digite uma mensagem.");
      }

      await addComentarioFn({
        data: {
          id,
          comentario,
        },
      });
    },
    onSuccess: () => {
      toast.success("Mensagem enviada.");
      setComentario("");
      qc.invalidateQueries({ queryKey: ["minha-solicitacao-historico", id] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Erro ao enviar mensagem.");
    },
  });

  const mensagens = Array.isArray(historico)
    ? historico.filter((h: any) => h.tipo === "comentario")
    : [];

  const eventos = Array.isArray(historico)
    ? historico.filter((h: any) => h.tipo !== "comentario")
    : [];

  useEffect(() => {
    const el = chatScrollRef.current;

    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [mensagens.length]);

  useEffect(() => {
    const el = timelineScrollRef.current;

    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [eventos.length]);

  return (
    <div className="space-y-6">
      <Link
        to="/area-te/minhas-solicitacoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para minhas solicitações
      </Link>

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !user ? (
        <EmptyAuth />
      ) : isLoading ? (
        <p className="text-muted-foreground">Carregando solicitação…</p>
      ) : !data ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Solicitação não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Não encontramos uma solicitação vinculada ao seu usuário.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Solicitação
                </div>

                <h1 className="mt-1 text-2xl font-bold">{data.titulo}</h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Aberta em {new Date(data.created_at).toLocaleString("pt-BR")}
                  {data.unidade ? ` · ${data.unidade}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                  {data.status}
                </span>

                <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                  {data.urgencia}
                </span>

                <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                  {data.tipo_solicitacao}
                </span>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <main className="space-y-6">
              <section className="rounded-xl border bg-card p-6">
                <h2 className="mb-4 font-semibold">Descrição</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {data.descricao}
                </p>
              </section>

              <section className="rounded-xl border bg-card">
                <div className="border-b p-6">
                  <h2 className="mb-1 font-semibold">Chat da solicitação</h2>
                  <p className="text-sm text-muted-foreground">
                    Envie mensagens para acompanhar a solicitação com a equipe de Tecnologia Educacional.
                  </p>
                </div>

                <div
                  ref={chatScrollRef}
                  className="max-h-[520px] overflow-y-auto overscroll-contain p-6">
                  {mensagens.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                      <p className="text-sm font-medium">Nenhuma mensagem registrada.</p>
                      <p className="text-sm text-muted-foreground">
                        Use o campo abaixo para enviar uma mensagem de acompanhamento.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mensagens.map((h: any) => {
                        const authorName = h.autor_nome ?? "Tecnologia Educacional";
                        const isCurrentUser = h.autor_id && user?.id && h.autor_id === user.id;

                        return (
                          <article
                            key={h.id}
                            className={`flex items-start gap-3 ${isCurrentUser ? "flex-row-reverse" : ""
                              }`}
                          >
                            <UserAvatar
                              path={h.autor_avatar_url}
                              name={authorName}
                              size={38}
                            />

                            <div
                              className={`min-w-0 flex-1 ${isCurrentUser ? "text-right" : ""
                                }`}
                            >
                              <div
                                className={`mb-1 flex flex-wrap items-center gap-2 ${isCurrentUser ? "justify-end" : ""
                                  }`}
                              >
                                <span className="text-sm font-semibold">{authorName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(h.created_at).toLocaleString("pt-BR")}
                                </span>
                              </div>

                              <div
                                className={`inline-block max-w-[820px] rounded-2xl border bg-background px-4 py-3 text-left ${isCurrentUser ? "rounded-tr-sm" : "rounded-tl-sm"
                                  }`}
                              >
                                {h.descricao && (
                                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
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

                <div className="border-t bg-card p-4">
                  <textarea
                    rows={3}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Digite uma mensagem para a equipe TE..."
                    className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
                  />

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => addComentario.mutate()}
                      disabled={addComentario.isPending || !comentario.trim()}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {addComentario.isPending ? "Enviando..." : "Enviar mensagem"}
                    </button>
                  </div>
                </div>
              </section>
            </main>

            <aside className="space-y-6">
              <section className="rounded-xl border bg-card p-6">
                <h2 className="mb-4 font-semibold">Resumo</h2>

                <div className="space-y-3 text-sm">
                  <Info label="Status" value={data.status} />
                  <Info label="Urgência" value={data.urgencia} />
                  <Info label="Tipo" value={data.tipo_solicitacao} />
                  <Info label="Unidade" value={data.unidade} />
                </div>
              </section>

              <section className="rounded-xl border bg-card p-6">
                <div className="mb-4">
                  <h2 className="font-semibold">Timeline</h2>
                  <p className="text-sm text-muted-foreground">
                    Eventos registrados durante o ciclo da solicitação.
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
                    {eventos.map((h: any) => (
                      <article
                        key={h.id}
                        className="rounded-lg border border-l-4 border-l-primary bg-muted/20 p-3"
                      >
                        <div className="text-sm font-semibold">{h.titulo}</div>

                        {h.descricao && (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                            {h.descricao}
                          </p>
                        )}

                        <div className="mt-2 text-xs text-muted-foreground">
                          {new Date(h.created_at).toLocaleString("pt-BR")}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {data.responsavel && (
                <section className="rounded-xl border bg-card p-6 text-center">
                  <h2 className="mb-4 font-semibold">Responsável</h2>

                  <UserAvatar
                    path={data.responsavel.avatar_url}
                    name={data.responsavel.nome_completo}
                    size={64}
                    className="mx-auto mb-3"
                  />

                  <div className="font-semibold">{data.responsavel.nome_completo}</div>
                  <div className="text-xs text-muted-foreground">
                    {data.responsavel.email}
                  </div>
                </section>
              )}

              {data.respostas && Object.keys(data.respostas).length > 0 && (
                <section className="rounded-xl border bg-card p-6">
                  <h2 className="mb-4 font-semibold">Informações enviadas</h2>

                  <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(data.respostas, null, 2)}
                  </pre>
                </section>
              )}
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyAuth() {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

      <h1 className="text-xl font-semibold">Entre para acompanhar sua solicitação</h1>

      <p className="mt-2 text-sm text-muted-foreground">
        O acompanhamento fica disponível para usuários logados.
      </p>

      <Link
        to="/auth"
        className="mt-5 inline-flex rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground"
      >
        Entrar
      </Link>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: any }) {
  if (!value) return null;

  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}