import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { UserAvatar } from "@/components/user-avatar";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre a TE" },
  { to: "/ferramentas", label: "Ferramentas" },
  { to: "/solicitacoes", label: "Solicitações" },
  { to: "/comunicados", label: "Comunicados" },
  { to: "/contatos", label: "Contatos" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile, loading } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            TE
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">Portal TE</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Colégio Positivo
            </div>
          </div>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((i) => {
            const active = i.to === "/" ? pathname === "/" : pathname.startsWith(i.to);
            return (
              <Link
                key={i.to}
                to={i.to}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted",
                )}
              >
                {i.label}
              </Link>
            );
          })}

          {!loading && user && (
            <Link
              to="/minhas-solicitacoes"
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5",
                pathname.startsWith("/minhas-solicitacoes")
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted",
              )}
            >
              <ClipboardList className="h-4 w-4" />
              Minhas solicitações
            </Link>
          )}
          {loading ? null : user ? (
            <Link
              to="/area-te/perfil"
              className="ml-2 inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border hover:bg-muted"
            >
              <UserAvatar path={profile?.avatar_url} name={profile?.nome_completo ?? user.email} size={28} />
              <span className="text-sm font-medium truncate max-w-[140px]">
                {profile?.nome_completo || user.email}
              </span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="ml-2 px-3 py-2 rounded-md text-sm font-semibold border border-border hover:bg-muted"
            >
              Entrar
            </Link>
          )}
        </nav>
        <button
          className="lg:hidden p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
              >
                {i.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/minhas-solicitacoes"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
              >
                Minhas solicitações
              </Link>
            )}
            <Link
              to="/area-te"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-semibold border"
            >
              Área da TE
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}