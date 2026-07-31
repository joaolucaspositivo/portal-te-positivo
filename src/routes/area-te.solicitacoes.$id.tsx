import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getSolicitacao, updateSolicitacao, deleteSolicitacao, listEquipeTE } from "@/lib/solicitacoes.functions";
import { STATUS_SOLICITACAO, statusColor, urgencyColor } from "@/lib/portal-constants";

export const Route = createFileRoute("/area-te/solicitacoes/$id")({
  component: SolicDetail,
});

function SolicDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getSolicitacao);
  const updateFn = useServerFn(updateSolicitacao);
  const equipeFn = useServerFn(listEquipeTE);
  const deleteFn = useServerFn(deleteSolicitacao);
  const { data, isLoading } = useQuery({
    queryKey: ["solic", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const { data: equipe = [] } = useQuery({
    queryKey: ["equipe-te-options"],
    queryFn: () => equipeFn(),
  });

  const [status, setStatus] = useState("");
  const [resp, setResp] = useState("");
  const [obs, setObs] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");

  useEffect(() => {
    if (data) {
      setStatus(data.status ?? "");
      setResp(data.responsavel_te ?? "");
      setObs(data.observacoes_internas ?? "");
      setResponsavelId(data.responsavel_id ?? "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await updateFn({
        data: {
          id,
          status,
          responsavel_te: resp || null,
          observacoes_internas: obs || null,
          responsavel_id: responsavelId || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Solicitação atualizada.");
      qc.invalidateQueries({ queryKey: ["solic", id] });
      qc.invalidateQueries({ queryKey: ["admin-solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["admin-solic"] });
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Carregando…</p>;

  const F = ({ l, v }: { l: string; v: any }) => v ? (
    <div><div className="text-xs text-muted-foreground">{l}</div><div className="font-medium">{v}</div></div>
  ) : null;

  return (
    <div>
      <Link to="/area-te/solicitacoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold">{data.titulo}</h1>
        <span className={`px-2 py-0.5 rounded text-xs ${statusColor(data.status)}`}>{data.status}</span>
        <span className={`px-2 py-0.5 rounded text-xs ${urgencyColor(data.urgencia)}`}>{data.urgencia}</span>
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
              <F l="Prazo desejado" v={data.prazo_desejado ? new Date(data.prazo_desejado).toLocaleDateString("pt-BR") : null} />
              <F l="Link" v={data.link_referencia ? <a href={data.link_referencia} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{data.link_referencia}</a> : null} />
            </div>
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-1">Descrição</div>
              <p className="whitespace-pre-wrap text-sm">{data.descricao}</p>
            </div>
            {data.observacoes_adicionais && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-1">Observações adicionais</div>
                <p className="whitespace-pre-wrap text-sm">{data.observacoes_adicionais}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Gestão interna</h2>
            <label className="block mb-3">
              <span className="text-sm font-medium">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm">
                {STATUS_SOLICITACAO.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="block mb-3">
              <span className="text-sm font-medium">Responsável (equipe TE)</span>
              <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm">
                <option value="">— Não atribuído</option>
                {equipe.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nome_completo || p.id}</option>
                ))}
              </select>
            </label>
            <label className="block mb-3">
              <span className="text-sm font-medium">Responsável (texto livre — legado)</span>
              <input value={resp} onChange={(e) => setResp(e.target.value)}
                     className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm" />
            </label>
            <label className="block mb-4">
              <span className="text-sm font-medium">Observações internas</span>
              <textarea rows={5} value={obs} onChange={(e) => setObs(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm" />
            </label>
            <button onClick={() => save.mutate()} disabled={save.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50">
              <Save className="h-4 w-4" /> Salvar alterações
            </button>
            <button onClick={async () => {
              if (!confirm("Excluir esta solicitação?")) return;
              try {
                await deleteFn({ data: { id } });
              } catch {
                return toast.error("Erro ao excluir.");
              }
              toast.success("Excluída.");
              navigate({ to: "/area-te/solicitacoes" });
            }} className="w-full mt-2 text-sm text-destructive hover:underline">Excluir solicitação</button>
          </div>
        </div>
      </div>
    </div>
  );
}