import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Mail, Phone, Search, Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/use-auth";
import { listContatosPublic } from "@/lib/conteudo.functions";
import { listUnidadesPublicas } from "@/lib/unidades.functions";

export const Route = createFileRoute("/contatos")({
  head: () => ({
    meta: [
      { title: "Contatos — Portal TE" },
      { name: "description", content: "Contatos da equipe de Tecnologia Educacional." },
    ],
  }),
  component: Contatos,
});

function Contatos() {
  const [q, setQ] = useState("");
  const [un, setUn] = useState("");

  const { user } = useAuth();
  const isAuthed = !!user;

  const listContatosFn = useServerFn(listContatosPublic);

  const listUnidadesFn = useServerFn(listUnidadesPublicas);

  const { data: items = [] } = useQuery({
    queryKey: ["contatos-public", isAuthed],
    queryFn: () => listContatosFn(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-publicas"],
    queryFn: () => listUnidadesFn(),
  });

  const filtered = items.filter((c: any) => {
  if (
    q &&
    !`${c.nome} ${c.funcao ?? ""} ${c.unidade ?? ""}`
      .toLowerCase()
      .includes(q.toLowerCase())
  ) {
    return false;
  }

  if (un && c.unidade !== un) return false;

  return true;
});

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-muted/40 border-b">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold">Contatos</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Contatos da equipe TE, referências por unidade e canais de apoio.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <div className="grid gap-3 sm:grid-cols-[1fr_240px] mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                className="w-full pl-9 pr-3 py-2 rounded-md border bg-background"
              />
            </div>

            <select
              value={un}
              onChange={(e) => setUn(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background"
            >
              <option value="">Todas unidades</option>
              {unidades.map((u: any) => (
                <option key={u.id} value={u.nome}>
                  {u.sigla ? `${u.nome} (${u.sigla})` : u.nome}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 border rounded-xl bg-card">
              <p className="text-muted-foreground">Nenhum contato encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c: any) => (
                <div key={c.id} className="p-6 rounded-xl border bg-card">
                  <div className="flex items-start gap-3">
                    <UserAvatar path={c.avatar_url} name={c.nome} size={48} />

                    <div className="min-w-0 flex-1">
                     <div className="font-semibold truncate">{c.nome}</div>
                      {c.funcao && (
                        <div className="text-sm text-muted-foreground truncate">{c.funcao}</div>
                      )}
                      {c.unidade && <div className="text-sm">{c.unidade}</div>}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    {isAuthed && c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" /> {c.email}
                      </a>
                    )}

                    {isAuthed && c.telefone_whatsapp && (
                      <div className="flex items-center gap-2 text-foreground/80">
                        <Phone className="h-3.5 w-3.5" /> {c.telefone_whatsapp}
                      </div>
                    )}

                    {!isAuthed && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" /> Faça login para ver e-mail e telefone
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}