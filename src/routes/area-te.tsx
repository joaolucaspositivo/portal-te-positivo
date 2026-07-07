import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Wrench,
  Megaphone,
  Users,
  LogOut,
  Home,
  UserCog,
  FormInput,
  User as UserIcon,
  Building2,
  Settings,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/area-te")({
  ssr: false,
  head: () => ({ meta: [{ title: "Área da TE — Portal TE" }] }),
  component: AreaTeLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: any;
  exact?: boolean;
  show: (r: { isAdmin: boolean; isEquipeTE: boolean; isEditor: boolean }) => boolean;
};

const nav: ReadonlyArray<NavItem> = [
  { to: "/area-te", label: "Dashboard", icon: LayoutDashboard, exact: true, show: (r) => r.isEquipeTE || r.isAdmin || r.isEditor },
  { to: "/area-te/minhas-solicitacoes", label: "Minhas solicitações", icon: ClipboardList, show: () => true },
  { to: "/area-te/solicitacoes", label: "Solicitações", icon: Inbox, show: (r) => r.isEquipeTE },
  { to: "/area-te/tipos-solicitacao", label: "Tipos de solicitação", icon: FormInput, show: (r) => r.isAdmin },
  { to: "/area-te/ferramentas", label: "Ferramentas", icon: Wrench, show: (r) => r.isEditor },
  { to: "/area-te/comunicados", label: "Comunicados", icon: Megaphone, show: (r) => r.isEditor },
  { to: "/area-te/contatos", label: "Contatos", icon: Users, show: (r) => r.isEditor },
  { to: "/area-te/unidades", label: "Unidades", icon: Building2, show: (r) => r.isAdmin },
  { to: "/area-te/usuarios", label: "Usuários", icon: UserCog, show: (r) => r.isAdmin },
  { to: "/area-te/perfil", label: "Meu perfil", icon: UserIcon, show: () => true },
  { to: "/area-te/configuracoes", label: "Configurações", icon: Settings, show: (r) => r.isAdmin },
];

function AreaTeLayout() {
  const { user, profile, status, isAdmin, isEquipeTE, isEditor, loading, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  async function handleLogout() {
    await logout();
    navigate({ to: "/" });
  }

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (loading || !user) return;
    if (pathname !== "/area-te") return;
    if (isAdmin || isEquipeTE || isEditor) return;

    navigate({ to: "/area-te/minhas-solicitacoes" });
  }, [loading, user, pathname, isAdmin, isEquipeTE, isEditor, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!user) return null;

  if (status === "bloqueado") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Conta bloqueada</h1>
          <p className="text-muted-foreground mb-4">
            Sua conta ({user.email}) foi bloqueada. Entre em contato com a equipe TE.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (status === "pendente") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Aguardando aprovação</h1>
          <p className="text-muted-foreground mb-4">
            Sua conta ({user.email}) foi criada e está aguardando aprovação de um administrador.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  const roleCtx = { isAdmin, isEquipeTE, isEditor };
  const visible = nav.filter((i) => i.show(roleCtx));

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground flex-shrink-0 hidden md:flex flex-col transition-all duration-200",
          sidebarCollapsed ? "w-20" : "w-64",
        )}>
        <div className={cn("border-b border-sidebar-border", sidebarCollapsed ? "p-3" : "p-5")}>
          <div
            className={cn(
              "flex items-center",
              sidebarCollapsed ? "flex-col gap-2" : "justify-between gap-2",
            )}
          >
            <Link
              to="/"
              className={cn(
                "flex min-w-0 items-center gap-2",
                sidebarCollapsed ? "justify-center" : "",
              )}
              title="Portal TE"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                TE
              </div>

              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-bold">Portal TE</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60">
                    Área da TE
                  </div>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent"
              aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visible.map((i) => {
            const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);

            return (
              <Link
                key={i.to}
                to={i.to as any}
                title={sidebarCollapsed ? i.label : undefined}
                className={cn(
                  "flex items-center rounded-md text-sm",
                  sidebarCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent",
                )}
              >
                <i.icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{i.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link
            to="/area-te/perfil"
            title={sidebarCollapsed ? "Meu perfil" : undefined}
            className={cn(
              "flex items-center rounded-md hover:bg-sidebar-accent",
              sidebarCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
            )}
          >
            <UserAvatar
              path={profile?.avatar_url}
              name={profile?.nome_completo ?? user.email}
              size={32}
            />

            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {profile?.nome_completo || user.email}
                </div>
                <div className="text-[10px] opacity-60 truncate">{user.email}</div>
              </div>
            )}
          </Link>

          <Link
            to="/"
            title={sidebarCollapsed ? "Voltar ao site" : undefined}
            className={cn(
              "flex items-center rounded-md text-sm hover:bg-sidebar-accent",
              sidebarCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Voltar ao site</span>}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sair" : undefined}
            className={cn(
              "w-full flex items-center rounded-md text-sm hover:bg-sidebar-accent",
              sidebarCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold">
            Portal TE · Admin
          </Link>
          <button onClick={handleLogout} className="text-sm">
            Sair
          </button>
        </header>

        <div className="md:hidden overflow-x-auto bg-sidebar text-sidebar-foreground border-t border-sidebar-border px-2 py-2 flex gap-1">
          {visible.map((i) => {
            const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);

            return (
              <Link
                key={i.to}
                to={i.to as any}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent",
                )}
              >
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