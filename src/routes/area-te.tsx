import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, Inbox, Wrench, Megaphone, Users, LogOut, Home,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/area-te")({
  ssr: false,
  head: () => ({ meta: [{ title: "Área da TE — Portal TE" }] }),
  component: AreaTeLayout,
});

const nav: ReadonlyArray<{ to: string; label: string; icon: any; exact?: boolean }> = [
  { to: "/area-te", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/area-te/solicitacoes", label: "Solicitações", icon: Inbox },
  { to: "/area-te/ferramentas", label: "Ferramentas", icon: Wrench },
  { to: "/area-te/comunicados", label: "Comunicados", icon: Megaphone },
  { to: "/area-te/contatos", label: "Contatos", icon: Users },
];

function AreaTeLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso restrito</h1>
          <p className="text-muted-foreground mb-4">
            Sua conta ({user.email}) não tem permissão de administrador. Solicite acesso à equipe TE.
          </p>
          <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">TE</div>
            <div>
              <div className="text-sm font-bold">Portal TE</div>
              <div className="text-[10px] uppercase tracking-wider opacity-60">Área da TE</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((i) => {
            const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);
            return (
              <Link key={i.to} to={i.to}
                    className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                      active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent")}>
                <i.icon className="h-4 w-4" /> {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent">
            <Home className="h-4 w-4" /> Voltar ao site
          </Link>
          <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" /> Sair
          </button>
          <div className="px-3 pt-2 text-xs opacity-60 truncate">{user.email}</div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="md:hidden bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold">Portal TE · Admin</Link>
          <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
                  className="text-sm">Sair</button>
        </header>
        <div className="md:hidden overflow-x-auto bg-sidebar text-sidebar-foreground border-t border-sidebar-border px-2 py-2 flex gap-1">
          {nav.map((i) => {
            const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);
            return (
              <Link key={i.to} to={i.to}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap",
                      active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent")}>
                <i.icon className="h-3.5 w-3.5" /> {i.label}
              </Link>
            );
          })}
        </div>
        <main className="p-6 md:p-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}