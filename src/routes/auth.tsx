import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

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
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/area-te" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/area-te" });
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { nome: name },
          emailRedirectTo: `${window.location.origin}/area-te`,
        },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Conta criada. Você já pode entrar.");
      setMode("login");
    }
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
            Acesso restrito à equipe de Tecnologia Educacional.
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
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="mt-4 text-sm text-primary hover:underline w-full text-center">
            {mode === "login" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}