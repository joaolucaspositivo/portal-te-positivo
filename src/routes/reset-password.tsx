import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const ResetSchema = z.object({ token: z.string().min(1), password: z.string().min(8).max(200) });

export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ResetSchema.parse(d))
  .handler(async ({ data }) => {
    const { consumePasswordResetToken } = await import("@/lib/password-reset.server");
    await consumePasswordResetToken(data.token, data.password);
    return { ok: true };
  });

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({ token: String(s.token ?? "") }),
  head: () => ({ meta: [{ title: "Redefinir senha — Portal TE" }] }),
  component: ResetPage,
});

function ResetPage() {
  const { token } = useSearch({ from: "/reset-password" });
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return toast.error("Token ausente.");
    setLoading(true);
    try {
      await resetPassword({ data: { token, password } });
      toast.success("Senha redefinida. Faça login.");
      navigate({ to: "/auth" });
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao redefinir");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <form onSubmit={submit} className="w-full max-w-md rounded-xl border bg-card p-8 space-y-4">
          <h1 className="text-2xl font-bold">Redefinir senha</h1>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Nova senha</span>
            <input type="password" required minLength={8} value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="px-3 py-2 rounded-md border bg-background" />
          </label>
          <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50">
            {loading ? "Aguarde…" : "Redefinir"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}