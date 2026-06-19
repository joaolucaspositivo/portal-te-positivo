import { createFileRoute } from "@tanstack/react-router";
import {
  Rocket, Cog, Wrench, AlertCircle, BarChart3, Plug, Network,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a TE — Portal TE" },
      { name: "description", content: "Sobre a Tecnologia Educacional do Colégio Positivo." },
    ],
  }),
  component: Sobre,
});

const apoios = [
  { icon: Rocket, title: "Apoio a novos projetos", desc: "com tecnologia educacional." },
  { icon: Cog, title: "Melhoria de processos", desc: "internos e pedagógicos." },
  { icon: Wrench, title: "Melhoria em sistemas", desc: "ou ferramentas existentes." },
  { icon: AlertCircle, title: "Correção e análise", desc: "de problemas reportados." },
  { icon: BarChart3, title: "Análise e diagnóstico", desc: "de cenários, ferramentas e necessidades." },
  { icon: Plug, title: "Implementação de soluções", desc: "digitais educacionais." },
  { icon: Network, title: "Articulação", desc: "com áreas pedagógicas e unidades." },
];

function Sobre() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-muted/40 border-b">
          <div className="container mx-auto px-4 py-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Sobre a Tecnologia Educacional
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-3xl">
              A Tecnologia Educacional apoia o uso estratégico de soluções, sistemas, ferramentas
              e processos digitais que contribuem para a prática pedagógica, a gestão educacional
              e a inovação no Colégio Positivo.
            </p>
          </div>
        </section>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-2">Como a TE pode apoiar</h2>
          <p className="text-muted-foreground mb-8">Frentes de atuação da equipe.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apoios.map((a) => (
              <div key={a.title} className="p-6 rounded-xl border bg-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold mb-1">{a.title}</div>
                <div className="text-sm text-muted-foreground">{a.desc}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-muted/40 py-16 border-t">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">Quando acionar a TE</h2>
            <p className="text-muted-foreground">
              Use o Portal TE para registrar solicitações relacionadas a projetos, melhorias,
              problemas, análises e outras demandas ligadas à Tecnologia Educacional. A equipe
              analisará a demanda e fará o encaminhamento conforme a priorização interna.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}