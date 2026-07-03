import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminFormShell, Field, inpCls } from "@/components/admin-form-shell";
import {
  deleteConfiguracaoOpcaoAdmin,
  listConfiguracaoOpcoesAdmin,
  saveConfiguracaoOpcaoAdmin,
} from "@/lib/configuracoes.functions";

export const Route = createFileRoute("/area-te/configuracoes")({
  component: ConfiguracoesPage,
});

type Grupo =
  | "categoria_comunicado"
  | "status_solicitacao"
  | "prioridade_solicitacao";

type Opcao = Partial<{
  id: string;
  grupo: Grupo;
  slug: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  ativo: boolean;
  ordem: number;
  padrao: boolean;
  aberta: boolean;
  peso: number;
}>;

const grupos: Array<{
  grupo: Grupo;
  titulo: string;
  descricao: string;
}> = [
  {
    grupo: "categoria_comunicado",
    titulo: "Categorias de comunicados",
    descricao: "Opções exibidas no cadastro de comunicados.",
  },
  {
    grupo: "status_solicitacao",
    titulo: "Status de solicitações",
    descricao: "Etapas usadas para acompanhar solicitações recebidas.",
  },
  {
    grupo: "prioridade_solicitacao",
    titulo: "Prioridades / urgências",
    descricao: "Níveis de urgência disponíveis no formulário e na gestão interna.",
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function ConfiguracoesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie listas de domínio usadas no Portal TE.
        </p>
      </div>

      <div className="space-y-8">
        {grupos.map((g) => (
          <ConfigSection
            key={g.grupo}
            grupo={g.grupo}
            titulo={g.titulo}
            descricao={g.descricao}
          />
        ))}
      </div>
    </div>
  );
}

function ConfigSection({
  grupo,
  titulo,
  descricao,
}: {
  grupo: Grupo;
  titulo: string;
  descricao: string;
}) {
  const qc = useQueryClient();

  const listFn = useServerFn(listConfiguracaoOpcoesAdmin);
  const saveFn = useServerFn(saveConfiguracaoOpcaoAdmin);
  const deleteFn = useServerFn(deleteConfiguracaoOpcaoAdmin);

  const [edit, setEdit] = useState<Opcao | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["configuracoes", grupo],
    queryFn: () =>
      listFn({
        data: {
          grupo,
        },
      }),
  });

  const save = useMutation({
    mutationFn: async (opcao: Opcao) => {
      if (!opcao.nome?.trim()) {
        throw new Error("Nome obrigatório.");
      }

      await saveFn({
        data: {
          id: opcao.id,
          grupo,
          nome: opcao.nome,
          slug: opcao.slug?.trim() || slugify(opcao.nome),
          descricao: opcao.descricao ?? null,
          cor: opcao.cor ?? null,
          ativo: opcao.ativo ?? true,
          ordem: Number(opcao.ordem ?? 0),
          padrao: !!opcao.padrao,
          aberta: grupo === "status_solicitacao" ? !!opcao.aberta : null,
          peso:
            grupo === "prioridade_solicitacao"
              ? Number(opcao.peso ?? 0)
              : null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Configuração salva.");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["configuracoes", grupo] });
      qc.invalidateQueries({ queryKey: ["config-public"] });
      qc.invalidateQueries({ queryKey: ["categorias-comunicado"] });
      qc.invalidateQueries({ queryKey: ["status-solicitacao"] });
      qc.invalidateQueries({ queryKey: ["prioridades-solicitacao"] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Erro ao salvar.");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await deleteFn({
        data: {
          id,
        },
      });
    },
    onSuccess: () => {
      toast.success("Configuração desativada.");
      qc.invalidateQueries({ queryKey: ["configuracoes", grupo] });
      qc.invalidateQueries({ queryKey: ["config-public"] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Erro ao desativar.");
    },
  });

  function novaOpcao() {
    setEdit({
      grupo,
      nome: "",
      slug: "",
      ativo: true,
      ordem: data.length * 10 + 10,
      padrao: false,
      aberta: grupo === "status_solicitacao",
      peso: grupo === "prioridade_solicitacao" ? data.length + 1 : 0,
    });
  }

  return (
    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="p-5 border-b flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>

        <button
          onClick={novaOpcao}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium"
        >
          <Plus className="h-4 w-4" /> Nova opção
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Ordem</th>
              <th className="p-3">Padrão</th>
              <th className="p-3">Ativo</th>
              {grupo === "status_solicitacao" && <th className="p-3">Aberta</th>}
              {grupo === "prioridade_solicitacao" && <th className="p-3">Peso</th>}
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  Nenhuma opção cadastrada.
                </td>
              </tr>
            ) : (
              data.map((item: any) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 font-medium">
                    {item.nome}
                    {item.descricao && (
                      <div className="text-xs text-muted-foreground">
                        {item.descricao}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs font-mono text-muted-foreground">
                    {item.slug}
                  </td>
                  <td className="p-3">{item.ordem}</td>
                  <td className="p-3">{item.padrao ? "Sim" : "Não"}</td>
                  <td className="p-3">{item.ativo ? "Sim" : "Não"}</td>
                  {grupo === "status_solicitacao" && (
                    <td className="p-3">{item.aberta ? "Sim" : "Não"}</td>
                  )}
                  {grupo === "prioridade_solicitacao" && (
                    <td className="p-3">{item.peso}</td>
                  )}
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setEdit(item)}
                      className="p-1.5 hover:bg-muted rounded mr-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (!confirm("Desativar esta opção?")) return;
                        remove.mutate(item.id);
                      }}
                      className="p-1.5 hover:bg-muted rounded text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {edit && (
        <AdminFormShell
          title={edit.id ? "Editar opção" : "Nova opção"}
          onClose={() => setEdit(null)}
          onSubmit={() => save.mutate(edit)}
          loading={save.isPending}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome *" full>
              <input
                required
                value={edit.nome ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    nome: e.target.value,
                    slug: edit.id ? edit.slug : slugify(e.target.value),
                  })
                }
                className={inpCls}
              />
            </Field>

            <Field label="Slug *" full>
              <input
                required
                value={edit.slug ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    slug: slugify(e.target.value),
                  })
                }
                className={inpCls}
              />
            </Field>

            <Field label="Descrição" full>
              <textarea
                rows={2}
                value={edit.descricao ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    descricao: e.target.value,
                  })
                }
                className={inpCls}
              />
            </Field>

            <Field label="Cor">
              <input
                value={edit.cor ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    cor: e.target.value,
                  })
                }
                className={inpCls}
                placeholder="Ex.: bg-blue-100 text-blue-800"
              />
            </Field>

            <Field label="Ordem">
              <input
                type="number"
                value={edit.ordem ?? 0}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    ordem: Number(e.target.value),
                  })
                }
                className={inpCls}
              />
            </Field>

            {grupo === "status_solicitacao" && (
              <label className="flex items-center gap-2 text-sm col-span-2">
                <input
                  type="checkbox"
                  checked={!!edit.aberta}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      aberta: e.target.checked,
                    })
                  }
                />
                Considerar este status como solicitação aberta
              </label>
            )}

            {grupo === "prioridade_solicitacao" && (
              <Field label="Peso">
                <input
                  type="number"
                  value={edit.peso ?? 0}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      peso: Number(e.target.value),
                    })
                  }
                  className={inpCls}
                />
              </Field>
            )}

            <label className="flex items-center gap-2 text-sm col-span-2">
              <input
                type="checkbox"
                checked={!!edit.padrao}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    padrao: e.target.checked,
                  })
                }
              />
              Opção padrão
            </label>

            <label className="flex items-center gap-2 text-sm col-span-2">
              <input
                type="checkbox"
                checked={!!edit.ativo}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    ativo: e.target.checked,
                  })
                }
              />
              Ativo
            </label>
          </div>
        </AdminFormShell>
      )}
    </section>
  );
}