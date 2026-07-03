export const STATUS_FERRAMENTA = [
  "Ativa",
  "Em piloto",
  "Em análise",
  "Em implantação",
  "Descontinuada",
] as const;

export const CATEGORIAS_FERRAMENTA = [
  "Pedagógica",
  "Gestão",
  "Comunicação",
  "Avaliação",
  "Produtividade",
  "Outra",
];

export const TIPOS_CONTATO = [
  "Equipe central TE",
  "Ponta TE na unidade",
  "Responsável por ferramenta",
  "Canal geral",
];

export function badgeColorFromConfig(cor?: string | null) {
  return cor?.trim() || "bg-muted text-muted-foreground";
}