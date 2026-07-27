import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const ForgotSchema = z.object({ email: z.string().email() });

export const forgotPassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ForgotSchema.parse(d))
  .handler(async ({ data }) => {
    const { prisma } = await import("@/lib/db.server");
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (user) {
      const { issuePasswordResetToken } = await import("@/lib/password-reset.server");
      const token = await issuePasswordResetToken(user.id);
      const base = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
      const { sendMail } = await import("@/lib/mail.server");
      await sendMail({
        to: data.email,
        subject: "Redefinição de senha — Portal TE",
        text: `Para redefinir sua senha, acesse: ${base}/reset-password?token=${token}\n\nO link expira em 1 hora.`,
      });
    }
    return { ok: true };
  });

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Esqueci a senha — Portal TE" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword({ data: { email } });
      toast.success("Se o e-mail existir, um link será enviado.");
    } catch (err: any) {
      toast.error(err.message ?? "Erro");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <form onSubmit={submit} className="w-full max-w-md rounded-xl border bg-card p-8 space-y-4">
          <h1 className="text-2xl font-bold">Esqueci minha senha</h1>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">E-mail</span>
            <input type="email" required value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="px-3 py-2 rounded-md border bg-background" />
          </label>
          <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50">
            {loading ? "Aguarde…" : "Enviar link"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}