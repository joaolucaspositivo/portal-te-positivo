import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
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

  return (
    <div>
      <Link
        to="/area-te/solicitacoes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold">{data.titulo}</h1>

        <span
          className={`px-2 py-0.5 rounded text-xs ${badgeColorFromConfig(
            statusColorMap.get(data.status) as string | null,
          )}`}
          style={badgeStyleFromConfig(statusColorMap.get(data.status) as string | null)}
        >
          {data.status}
        </span>

        <span
          className={`px-2 py-0.5 rounded text-xs ${badgeColorFromConfig(
            prioridadeColorMap.get(data.urgencia) as string | null,
          )}`}
          style={badgeStyleFromConfig(prioridadeColorMap.get(data.urgencia) as string | null)}
        >
          {data.urgencia}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Aberta em {new Date(data.created_at).toLocaleString("pt-BR")} · {data.tipo_solicitacao}
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Solicitante</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <F l="Nome" v={data.nome_solicitante} />
              <F l="E-mail" v={data.email_solicitante} />
              <F l="Unidade" v={data.unidade} />
              <F l="Segmento / Área" v={data.segmento_area} />
              <F l="Cargo / Função" v={data.cargo_funcao} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Detalhes</h2>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
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

            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-1">Descrição</div>
              <p className="whitespace-pre-wrap text-sm">{data.descricao}</p>
            </div>

            {data.observacoes_adicionais && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Observações adicionais
                </div>
                <p className="whitespace-pre-wrap text-sm">{data.observacoes_adicionais}</p>
              </div>
            )}

            {data.respostas && Object.keys(data.respostas).length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-2">Respostas específicas</div>
                <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto">
                  {JSON.stringify(data.respostas, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Gestão interna</h2>

            {data.responsavel && (
              <div className="mb-4 rounded-md bg-muted p-3 text-sm">
                <div className="text-xs text-muted-foreground">Responsável atual</div>
                <div className="font-medium">{data.responsavel.nome_completo}</div>
                <div className="text-xs text-muted-foreground">{data.responsavel.email}</div>
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
              <span className="text-sm font-medium">Responsável (equipe TE)</span>
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

            <label className="block mb-3">
              <span className="text-sm font-medium">Responsável (texto livre — legado)</span>
              <input
                value={resp}
                onChange={(e) => setResp(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </label>

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
              className="w-full mt-2 text-sm text-destructive hover:underline disabled:opacity-50"
            >
              Excluir solicitação
            </button>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Histórico</h2>

            {historico.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum histórico registrado.
              </p>
            ) : (
              <div className="space-y-4">
                {historico.map((h: any) => (
                  <div key={h.id} className="border-l-2 pl-3">
                    <div className="text-sm font-medium">{h.titulo}</div>

                    {h.descricao && (
                      <p className="text-sm text-muted-foreground">
                        {h.descricao}
                      </p>
                    )}

                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString("pt-BR")}
                      {h.autor_nome ? ` · ${h.autor_nome}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}