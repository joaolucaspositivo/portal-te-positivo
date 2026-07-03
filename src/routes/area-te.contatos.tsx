import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { listContatosAdmin } from "@/lib/conteudo.functions";

export const Route = createFileRoute("/area-te/contatos")({
  component: AdminContatos,
});

function AdminContatos() {
  const listContatosFn = useServerFn(listContatosAdmin);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-contatos"],
    queryFn: () => listContatosFn(),
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contatos</h1>
          <p className="text-muted-foreground">
            {data.length} usuários exibidos na página pública de contatos.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Para adicionar ou remover alguém desta lista, edite o usuário e marque ou desmarque
            “Exibir este usuário na página de contatos”.
          </p>
        </div>

        <Link
          to="/area-te/usuarios"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-background text-sm font-medium hover:bg-muted"
        >
          <Pencil className="h-4 w-4" />
          Gerenciar usuários
        </Link>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Usuário</th>
              <th className="p-3">Função</th>
              <th className="p-3">Unidade</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Telefone</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Nenhum usuário marcado para aparecer em contatos.
                </td>
              </tr>
            ) : (
              data.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar path={c.avatar_url} name={c.nome} size={36} />
                      <div>
                        <div className="font-medium">{c.nome}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{c.funcao || "—"}</td>
                  <td className="p-3">{c.unidade || "—"}</td>
                  <td className="p-3">{c.email || "—"}</td>
                  <td className="p-3">{c.telefone_whatsapp || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}