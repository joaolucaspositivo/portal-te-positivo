import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser, requestPasswordReset, signIn, signUp } from "@/lib/auth.functions";
import { setLocalAuthTokens } from "@/lib/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Entrar — Portal TE" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const signInFn = useServerFn(signIn);
  const signUpFn = useServerFn(signUp);
  const requestPasswordResetFn = useServerFn(requestPasswordReset);
  const getCurrentUserFn = useServerFn(getCurrentUser);

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordHelp =
    "Use pelo menos 8 caracteres, com letra maiúscula, letra minúscula e número.";

  useEffect(() => {
    let mounted = true;

    getCurrentUserFn().then((currentUser) => {
      if (!mounted) return;
      if (currentUser) navigate({ to: "/minhas-solicitacoes" });
    });

    return () => {
      mounted = false;
    };
  }, [getCurrentUserFn, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      if (mode === "forgot") {
        await requestPasswordResetFn({
          data: {
            email,
          },
        });

        toast.success("Se o e-mail estiver cadastrado, enviaremos um link de redefinição.");
        setMode("login");
        setPassword("");
        return;
      }

      if (mode === "login") {
        const result = await signInFn({
          data: {
            email,
            password,
          },
        });

        setLocalAuthTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });

        toast.success("Login realizado com sucesso.");
        navigate({ to: "/minhas-solicitacoes" });
        return;
      }

      await signUpFn({
        data: {
          email,
          password,
          nome: name,
        },
      });

      toast.success("Conta criada. Você já pode entrar.");
      setMode("login");
      setPassword("");
    } catch (error: any) {
      toast.error(error?.message ?? "Não foi possível concluir a autenticação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-bold mb-1">
            {mode === "login"
              ? "Entrar no Portal TE"
              : mode === "signup"
                ? "Criar conta"
                : "Redefinir senha"}
          </h1>

          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signup"
              ? "Crie sua conta — o acesso à Área da TE será liberado após aprovação de um administrador."
              : mode === "forgot"
                ? "Informe seu e-mail para receber um link de redefinição de senha."
                : "Acesse sua conta para acompanhar solicitações e utilizar os recursos do Portal TE."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Nome</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="px-3 py-2 rounded-md border bg-background"
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background"
              />
            </label>

            {mode !== "forgot" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Senha</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3 py-2 rounded-md border bg-background"
                />
                {mode === "signup" && (
                  <span className="text-xs text-muted-foreground">{passwordHelp}</span>
                )}
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {loading
                ? "Aguarde…"
                : mode === "login"
                  ? "Entrar"
                  : mode === "signup"
                    ? "Criar conta"
                    : "Enviar link de redefinição"}
            </button>
          </form>

          <div className="mt-4 space-y-2 text-center">
            {mode !== "forgot" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setPassword("");
                }}
                className="text-sm text-muted-foreground hover:text-primary hover:underline w-full"
              >
                Esqueci minha senha
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setPassword("");
              }}
              className="text-sm text-primary hover:underline w-full"
            >
              {mode === "signup" ? "Já tem conta? Entrar" : "Não tem conta? Criar conta"}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setPassword("");
                }}
                className="text-sm text-primary hover:underline w-full"
              >
                Voltar para login
              </button>
            )}
          </div>

          <div className="mt-6 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ClipboardList className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">Acompanhe suas solicitações</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Após entrar, você poderá visualizar as solicitações abertas com seu usuário e acompanhar o andamento.
                </p>

                <Link
                  to="/minhas-solicitacoes"
                  className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  Ir para minhas solicitações
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}