export function SiteFooter() {
  return (
    <footer className="border-t bg-foreground text-background mt-16">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              TE
            </div>
            <div className="font-bold">Portal TE</div>
          </div>
          <p className="text-sm text-background/70">
            Tecnologia Educacional · Colégio Positivo
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Atalhos</h4>
          <ul className="space-y-1 text-sm text-background/70">
            <li>Abrir solicitação</li>
            <li>Ferramentas</li>
            <li>Comunicados</li>
            <li>Contatos</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contato</h4>
          <p className="text-sm text-background/70">
            tecipp@colegiopositivo.com.br
          </p>
        </div>
      </div>
      <div className="border-t border-background/10 py-4 text-center text-xs text-background/50">
        © {new Date().getFullYear()} Colégio Positivo · Portal TE
      </div>
    </footer>
  );
}