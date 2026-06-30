import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resetPassword } from "@/lib/auth.functions";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Redefinir senha — Portal TE" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const resetPasswordFn = useServerFn(resetPassword);

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      toast.error("Link de redefinição inválido.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);

    try {
      await resetPasswordFn({
        data: {
          token,
          password,
        },
      });

      toast.success("Senha redefinida com sucesso. Faça login novamente.");
      navigate({ to: "/auth" });
    } catch (error: any) {
      toast.error(error?.message ?? "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-bold mb-1">Redefinir senha</h1>

          <p className="text-sm text-muted-foreground mb-6">
            Informe uma nova senha para acessar o Portal TE.
          </p>

          {!token && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Link de redefinição inválido ou incompleto.
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Nova senha</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Confirmar nova senha</span>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {loading ? "Aguarde…" : "Redefinir senha"}
            </button>
          </form>

          <button
            onClick={() => navigate({ to: "/auth" })}
            className="mt-4 text-sm text-primary hover:underline w-full text-center"
          >
            Voltar para login
          </button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}