import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { ImageUploadField } from "@/components/image-upload-field";
import { UserAvatar } from "@/components/user-avatar";
import { updateMyProfile } from "@/lib/profile.functions";
import { listUnidadesPublicas } from "@/lib/unidades.functions";

export const Route = createFileRoute("/area-te/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const { user, profile, refresh, loading } = useAuth();
  const updateMyProfileFn = useServerFn(updateMyProfile);

  const listUnidadesPublicasFn = useServerFn(listUnidadesPublicas);

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-publicas"],
    queryFn: () => listUnidadesPublicasFn(),
  });

  const [form, setForm] = useState({
    nome_completo: "",
    cargo: "",
    unidade: "",
    telefone: "",
    bio: "",
    avatar_url: null as string | null,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        nome_completo: profile.nome_completo ?? "",
        cargo: profile.cargo ?? "",
        unidade: profile.unidade ?? "",
        telefone: profile.telefone ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? null,
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sem sessão.");

      await updateMyProfileFn({
        data: form,
      });
    },
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      refresh();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar."),
  });

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">Meu perfil</h1>
      <p className="text-muted-foreground mb-6">Atualize seus dados e sua foto.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-6 rounded-xl border bg-card p-6"
      >
        <div className="flex items-center gap-4">
          <UserAvatar path={form.avatar_url} name={form.nome_completo || user?.email} size={72} />
          <div className="flex-1">
            <div className="text-sm font-medium mb-2">Foto de perfil</div>
            <ImageUploadField
              folder={user?.id ?? "anon"}
              value={form.avatar_url}
              onChange={(p) => setForm((f) => ({ ...f, avatar_url: p }))}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Nome completo</span>
            <input
              value={form.nome_completo}
              onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Cargo / função</span>
            <input
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Unidade</span>
            <select
              value={form.unidade}
              onChange={(e) => setForm({ ...form, unidade: e.target.value })}
              className="px-3 py-2 rounded-md border bg-background text-sm"
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
              <span className="text-xs text-muted-foreground">
                Nenhuma unidade ativa cadastrada.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Telefone</span>
            <input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Bio</span>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            />
          </label>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          E-mail: <span className="font-mono">{user?.email}</span> · status:{" "}
          <span className="font-medium">{profile?.status ?? "—"}</span>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={save.isPending}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50"
          >
            {save.isPending ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}