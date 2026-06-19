import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
          <Link
            to="/area-te"
            className="ml-2 px-3 py-2 rounded-md text-sm font-semibold border border-border hover:bg-muted"
          >
            Área da TE
          </Link>
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