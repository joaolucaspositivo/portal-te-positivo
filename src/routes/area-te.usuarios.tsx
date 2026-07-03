import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Search, Shield, UserCheck, UserX, KeyRound, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { UserAvatar } from "@/components/user-avatar";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";
import {
  listUsers,
  setUserStatus,
  setUserRoles,
  adminUpdateProfile,
  sendPasswordReset,
  deleteUser,
} from "@/lib/users.functions";
import {
  listUnidades,
  listUnidadesDoUsuario,
  setUserUnidades,
} from "@/lib/unidades.functions";

export const Route = createFileRoute("/area-te/usuarios")({
  component: AdminUsers,
});

const ALL_ROLES = ["admin", "equipe_te", "editor", "usuario"] as const;

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  equipe_te: "Equipe TE",
  editor: "Editor",
  usuario: "Usuário",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  ativo: "Ativo",
  bloqueado: "Bloqueado",
};

const STATUS_COLOR: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  ativo: "bg-emerald-100 text-emerald-800",
  bloqueado: "bg-red-100 text-red-800",
};

function AdminUsers() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const list = useServerFn(listUsers);

  const { data = [], isLoading } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-users"],
    queryFn: () => list(),
  });

  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("");
  const [roleF, setRoleF] = useState("");
  const [edit, setEdit] = useState<any | null>(null);

  const filtered = useMemo(
    () =>
      data.filter((u: any) => {
        if (statusF && (u.profile?.status ?? "pendente") !== statusF) return false;
        if (roleF && !u.roles.includes(roleF)) return false;

        if (q) {
          const unidadesText = (u.unidades ?? [])
            .map((unidade: any) => `${unidade.nome} ${unidade.sigla}`)
            .join(" ");

          const text = `${u.email} ${u.profile?.nome_completo ?? ""} ${u.profile?.cargo ?? ""
            } ${unidadesText}`.toLowerCase();

          if (!text.includes(q.toLowerCase())) return false;
        }

        return true;
      }),
    [data, q, statusF, roleF],
  );

  const setStatusMut = useMutation({
    mutationFn: useServerFn(setUserStatus),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Status atualizado.");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;

  if (!isAdmin) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-semibold">Acesso restrito</p>
        <p className="text-sm text-muted-foreground">
          Apenas administradores podem gerenciar usuários.
        </p>
      </div>
    );
  }

  const pendentes = data.filter(
    (u: any) => (u.profile?.status ?? "pendente") === "pendente",
  ).length;

  return (
    <div>
      <h1 className="text-3xl font-bold">Usuários</h1>
      <p className="text-muted-foreground mb-6">
        {data.length} cadastrados{" "}
        {pendentes > 0 && (
          <span className="text-amber-700">· {pendentes} aguardando aprovação</span>
        )}
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px] mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, e-mail ou unidade…"
            className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm"
          />
        </div>

        <select
          value={statusF}
          onChange={(e) => setStatusF(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="">Todos status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={roleF}
          onChange={(e) => setRoleF(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="">Todos papéis</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Usuário</th>
              <th className="p-3">Unidades</th>
              <th className="p-3">Papéis</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Nenhum usuário.
                </td>
              </tr>
            ) : (
              filtered.map((u: any) => {
                const status = u.profile?.status ?? "pendente";

                return (
                  <tr key={u.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          path={u.profile?.avatar_url}
                          name={u.profile?.nome_completo ?? u.email}
                          size={36}
                        />
                        <div>
                          <div className="font-medium">{u.profile?.nome_completo || "—"}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.unidades?.length ?? 0) === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          u.unidades.map((unidade: any) => (
                            <span
                              key={unidade.id}
                              title={unidade.nome}
                              className={`px-2 py-0.5 rounded text-xs ${unidade.principal
                                ? "bg-primary/10 text-primary"
                                : "bg-muted"
                                }`}
                            >
                              {unidade.sigla}
                              {unidade.principal ? " · principal" : ""}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          u.roles.map((r: string) => (
                            <span key={r} className="px-2 py-0.5 rounded text-xs bg-muted">
                              {ROLE_LABEL[r] ?? r}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      {status === "pendente" && (
                        <button
                          onClick={() =>
                            setStatusMut.mutate({
                              data: { userId: u.id, status: "ativo" },
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-600 text-white mr-1"
                          title="Aprovar"
                        >
                          <UserCheck className="h-3 w-3" /> Aprovar
                        </button>
                      )}

                      <button
                        onClick={() => setEdit(u)}
                        className="p-1.5 rounded hover:bg-muted"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {edit && <EditUserDrawer user={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function EditUserDrawer({ user, onClose }: { user: any; onClose: () => void }) {
  const qc = useQueryClient();

  const [profile, setProfile] = useState({
    nome_completo: user.profile?.nome_completo ?? "",
    cargo: user.profile?.cargo ?? "",
    unidade: user.profile?.unidade ?? "",
    telefone: user.profile?.telefone ?? "",
    bio: user.profile?.bio ?? "",
    exibir_contato: user.profile?.exibir_contato ?? false,
  });

  const [roles, setRoles] = useState<string[]>(user.roles ?? []);
  const [unidadeIds, setUnidadeIds] = useState<string[]>([]);
  const [principalId, setPrincipalId] = useState<string | null>(null);
  const [vinculosHydrated, setVinculosHydrated] = useState(false);

  const updateProfileFn = useServerFn(adminUpdateProfile);
  const setRolesFn = useServerFn(setUserRoles);
  const setStatusFn = useServerFn(setUserStatus);
  const resetFn = useServerFn(sendPasswordReset);
  const deleteFn = useServerFn(deleteUser);
  const listUnidadesFn = useServerFn(listUnidades);
  const listUserUnidadesFn = useServerFn(listUnidadesDoUsuario);
  const setUserUnidadesFn = useServerFn(setUserUnidades);

  const { data: unidades = [], isLoading: unidadesLoading } = useQuery({
    queryKey: ["admin-unidades"],
    queryFn: () => listUnidadesFn(),
  });

  const {
    data: vinculosAtuais = [],
    isLoading: vinculosLoading,
    isSuccess: vinculosLoaded,
  } = useQuery({
    queryKey: ["admin-user-unidades", user.id],
    queryFn: () => listUserUnidadesFn({ data: { userId: user.id } }),
  });

  useEffect(() => {
    if (!vinculosLoaded || vinculosHydrated) return;

    const ids = vinculosAtuais.map((v: any) => v.unidade_id);
    const principal = vinculosAtuais.find((v: any) => v.principal)?.unidade_id ?? ids[0] ?? null;

    setUnidadeIds(ids);
    setPrincipalId(principal);
    setVinculosHydrated(true);
  }, [vinculosLoaded, vinculosHydrated, vinculosAtuais]);

  const save = useMutation({
    mutationFn: async () => {
      if (roles.length === 0) {
        throw new Error("Selecione pelo menos um papel para o usuário.");
      }

      const selectedPrincipalId =
        principalId && unidadeIds.includes(principalId)
          ? principalId
          : unidadeIds[0] ?? null;

      await updateProfileFn({
        data: {
          userId: user.id,
          ...profile,
        },
      });

      await setRolesFn({
        data: {
          userId: user.id,
          roles: roles as any,
        },
      });

      await setUserUnidadesFn({
        data: {
          userId: user.id,
          unidadeIds,
          principalId: selectedPrincipalId,
        },
      });
    },
    onSuccess: () => {
      toast.success("Usuário atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-unidades"] });
      qc.invalidateQueries({ queryKey: ["admin-user-unidades", user.id] });
      qc.invalidateQueries({ queryKey: ["profiles-options"] });
      qc.invalidateQueries({ queryKey: ["admin-contatos"] });
      qc.invalidateQueries({ queryKey: ["contatos-public"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro."),
  });

  const status = user.profile?.status ?? "pendente";

  function toggleRole(r: string) {
    setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
  }

  function toggleUnidade(id: string) {
    if (unidadeIds.includes(id)) {
      const next = unidadeIds.filter((x) => x !== id);
      setUnidadeIds(next);

      if (principalId === id) {
        setPrincipalId(next[0] ?? null);
      }

      return;
    }

    const next = [...unidadeIds, id];

    setUnidadeIds(next);

    if (!principalId) {
      setPrincipalId(id);
    }
  }

  return (
    <AdminFormShell
      title={`Editar usuário · ${user.email}`}
      onClose={onClose}
      onSubmit={() => save.mutate()}
      loading={save.isPending}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome completo" full>
          <input
            value={profile.nome_completo}
            onChange={(e) => setProfile({ ...profile, nome_completo: e.target.value })}
            className={inpCls}
          />
        </Field>

        <Field label="Cargo">
          <input
            value={profile.cargo}
            onChange={(e) => setProfile({ ...profile, cargo: e.target.value })}
            className={inpCls}
          />
        </Field>

        <Field label="Unidade no perfil">
          <input
            value={profile.unidade}
            onChange={(e) => setProfile({ ...profile, unidade: e.target.value })}
            className={inpCls}
            placeholder="Campo textual legado"
          />
        </Field>

        <Field label="Telefone" full>
          <input
            value={profile.telefone}
            onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
            className={inpCls}
          />
        </Field>

        <Field label="Bio" full>
          <textarea
            rows={3}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className={inpCls}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm col-span-2 rounded-md border bg-background px-3 py-2">
          <input
            type="checkbox"
            checked={!!profile.exibir_contato}
            onChange={(e) =>
              setProfile({
                ...profile,
                exibir_contato: e.target.checked,
              })
            }
          />
          Exibir este usuário na página de contatos
        </label>

        <div className="col-span-2 border-t pt-3 mt-1">
          <div className="text-sm font-medium mb-2">Papéis</div>

          <div className="grid grid-cols-2 gap-2">
            {ALL_ROLES.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded border bg-background"
              >
                <input
                  type="checkbox"
                  checked={roles.includes(r)}
                  onChange={() => toggleRole(r)}
                />
                {ROLE_LABEL[r]}
              </label>
            ))}
          </div>
        </div>

        <div className="col-span-2 border-t pt-3 mt-1">
          <div className="text-sm font-medium mb-2">Unidades vinculadas</div>

          {unidadesLoading || vinculosLoading ? (
            <p className="text-xs text-muted-foreground">Carregando unidades…</p>
          ) : unidades.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma unidade cadastrada ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {unidades.map((u: any) => {
                const checked = unidadeIds.includes(u.id);

                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded border bg-background"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUnidade(u.id)}
                    />

                    <span className="flex-1">
                      {u.nome}{" "}
                      <span className="text-xs text-muted-foreground">({u.sigla})</span>
                      {u.status === "inativa" && (
                        <span className="ml-1 text-xs text-muted-foreground">· inativa</span>
                      )}
                    </span>

                    {checked && (
                      <label className="text-xs flex items-center gap-1 text-muted-foreground">
                        <input
                          type="radio"
                          name="principal"
                          checked={principalId === u.id}
                          onChange={() => setPrincipalId(u.id)}
                        />
                        principal
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-span-2 border-t pt-3 mt-1 space-y-2">
          <div className="text-sm font-medium mb-1">Ações</div>

          <div className="flex flex-wrap gap-2">
            {status !== "ativo" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await setStatusFn({
                      data: {
                        userId: user.id,
                        status: "ativo",
                      },
                    });

                    toast.success("Aprovado.");
                    qc.invalidateQueries({ queryKey: ["admin-users"] });
                  } catch (e: any) {
                    toast.error(e.message ?? "Erro.");
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-emerald-600 text-white"
              >
                <UserCheck className="h-4 w-4" /> Aprovar
              </button>
            )}

            {status !== "bloqueado" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await setStatusFn({
                      data: {
                        userId: user.id,
                        status: "bloqueado",
                      },
                    });

                    toast.success("Bloqueado.");
                    qc.invalidateQueries({ queryKey: ["admin-users"] });
                  } catch (e: any) {
                    toast.error(e.message ?? "Erro.");
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-red-600 text-white"
              >
                <UserX className="h-4 w-4" /> Bloquear
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                try {
                  await resetFn({
                    data: {
                      email: user.email,
                    },
                  });

                  toast.success("Link de redefinição enviado.");
                } catch (e: any) {
                  toast.error(e.message ?? "Erro.");
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded border"
            >
              <KeyRound className="h-4 w-4" /> Enviar redefinição de senha
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!confirm(`Excluir definitivamente ${user.email}?`)) return;

                try {
                  await deleteFn({
                    data: {
                      userId: user.id,
                    },
                  });

                  toast.success("Excluído.");
                  qc.invalidateQueries({ queryKey: ["admin-users"] });
                  onClose();
                } catch (e: any) {
                  toast.error(e.message ?? "Erro.");
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-destructive text-destructive ml-auto"
            >
              <Trash2 className="h-4 w-4" /> Excluir conta
            </button>
          </div>
        </div>
      </div>
    </AdminFormShell>
  );
}