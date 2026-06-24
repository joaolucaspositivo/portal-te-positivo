import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { UserAvatar } from "@/components/user-avatar";
import {
  getUnidade, updateUnidade, listUsuariosDaUnidade,
  vincularUsuario, desvincularUsuario, definirUnidadePrincipal,
} from "@/lib/unidades.functions";
import { listUsers } from "@/lib/users.functions";
import { UnidadeFields } from "./area-te.unidades";

export const Route = createFileRoute("/area-te/unidades/$id")({
  component: UnidadeDetail,
});

function UnidadeDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, loading } = useAuth();

  const getFn = useServerFn(getUnidade);
  const { data: unidade } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-unidade", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const usersFn = useServerFn(listUsuariosDaUnidade);
  const { data: vinculados = [] } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-unidade-users", id],
    queryFn: () => usersFn({ data: { unidadeId: id } }),
  });

  const listUsersFn = useServerFn(listUsers);
  const { data: allUsers = [] } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-users"],
    queryFn: () => listUsersFn(),
  });

  const [v, setV] = useState<any>(null);
  useEffect(() => { if (unidade) setV({ ...unidade, email: unidade.email ?? "" }); }, [unidade]);

  const updateFn = useServerFn(updateUnidade);
  const saveMut = useMutation({
    mutationFn: () => updateFn({ data: { id, ...v } as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-unidade", id] }); qc.invalidateQueries({ queryKey: ["admin-unidades"] }); toast.success("Salvo."); },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  const vincFn = useServerFn(vincularUsuario);
  const desvincFn = useServerFn(desvincularUsuario);
  const defPrincFn = useServerFn(definirUnidadePrincipal);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-unidade-users", id] });
    qc.invalidateQueries({ queryKey: ["admin-unidades"] });
  };

  const [pickUserId, setPickUserId] = useState("");

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!isAdmin) return <p>Acesso restrito.</p>;
  if (!v) return <p className="text-muted-foreground">Carregando unidade…</p>;

  const vinculadosIds = new Set(vinculados.map((x: any) => x.user_id));
  const disponiveis = allUsers.filter((u: any) => !vinculadosIds.has(u.id));

  return (
    <div>
      <Link to="/area-te/unidades" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{unidade?.nome}</h1>
        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
          {saveMut.isPending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4 mb-6">
        <UnidadeFields value={v} onChange={setV} />
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Usuários vinculados ({vinculados.length})</h2>

        <div className="flex gap-2 mb-4">
          <select value={pickUserId} onChange={(e) => setPickUserId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border bg-background text-sm">
            <option value="">Selecione um usuário para vincular…</option>
            {disponiveis.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.profile?.nome_completo ? `${u.profile.nome_completo} — ${u.email}` : u.email}
              </option>
            ))}
          </select>
          <button disabled={!pickUserId}
                  onClick={async () => {
                    try {
                      await vincFn({ data: { unidadeId: id, userId: pickUserId } });
                      setPickUserId("");
                      invalidate();
                      toast.success("Usuário vinculado.");
                    } catch (e: any) { toast.error(e.message ?? "Erro."); }
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50">
            <UserPlus className="h-4 w-4" /> Vincular
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Usuário</th><th className="p-3">Principal</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {vinculados.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Nenhum usuário vinculado.</td></tr>
              ) : vinculados.map((u: any) => (
                <tr key={u.user_id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar path={u.profile?.avatar_url} name={u.profile?.nome_completo ?? u.email} size={32} />
                      <div>
                        <div className="font-medium">{u.profile?.nome_completo || "—"}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <button onClick={async () => {
                      try { await defPrincFn({ data: { unidadeId: id, userId: u.user_id } }); invalidate(); toast.success("Unidade principal atualizada."); }
                      catch (e: any) { toast.error(e.message ?? "Erro."); }
                    }} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${u.principal ? "bg-amber-100 text-amber-800" : "hover:bg-muted text-muted-foreground"}`}>
                      <Star className={`h-3 w-3 ${u.principal ? "fill-current" : ""}`} /> {u.principal ? "Principal" : "Tornar principal"}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={async () => {
                      if (!confirm("Desvincular usuário desta unidade?")) return;
                      try { await desvincFn({ data: { unidadeId: id, userId: u.user_id } }); invalidate(); toast.success("Desvinculado."); }
                      catch (e: any) { toast.error(e.message ?? "Erro."); }
                    }} className="p-1.5 rounded hover:bg-muted text-destructive" title="Desvincular">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}