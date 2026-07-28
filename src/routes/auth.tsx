import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { signIn, signUp, fetchCurrentUser } from "@/lib/auth-client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Entrar — Portal TE" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then((me) => {
        if (me) navigate({ to: "/area-te" });
      })
      .catch(() => {});
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        navigate({ to: "/area-te" });
      } else {
        await signUp(email, password, name);
        toast.success("Conta criada. Aguarde aprovação de um administrador para acessar a Área da TE.");
        navigate({ to: "/area-te" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  }

  function loginWithGoogle() {
    window.location.href = "/api/auth/google";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-bold mb-1">
            {mode === "login" ? "Entrar na Área da TE" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signup"
              ? "Crie sua conta — o acesso à Área da TE será liberado após aprovação de um administrador."
              : "Acesse sua conta do Portal TE."}
          </p>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Nome</span>
                <input value={name} onChange={(e) => setName(e.target.value)}
                       className="px-3 py-2 rounded-md border bg-background" />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">E-mail</span>
              <input type="email" required value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="px-3 py-2 rounded-md border bg-background" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Senha</span>
              <input type="password" required minLength={6} value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="px-3 py-2 rounded-md border bg-background" />
            </label>
            <button type="submit" disabled={loading}
                    className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50">
              {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full py-2.5 rounded-md border font-medium hover:bg-muted transition flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24 24 0 000 21.56l7.98-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Entrar com Google
          </button>
          <div className="mt-4 flex items-center justify-between text-sm">
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="mt-4 text-sm text-primary hover:underline w-full text-center">
            {mode === "login" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
            <a href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
              Esqueci a senha
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}