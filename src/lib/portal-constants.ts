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

export function isHexColor(cor?: string | null) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(cor?.trim() ?? "");
}

export function badgeColorFromConfig(cor?: string | null) {
  const value = cor?.trim();

  if (!value || isHexColor(value)) {
    return "bg-muted text-muted-foreground border border-transparent";
  }

  return value;
}

export function badgeStyleFromConfig(cor?: string | null) {
  const value = cor?.trim();

  if (!isHexColor(value)) {
    return undefined;
  }

  return {
    backgroundColor: `${value}22`,
    color: value,
    borderColor: `${value}66`,
  };
}

export function ferramentaStatusColor(status?: string | null) {
  switch (status?.trim()) {
    case "Ativa":
      return "bg-green-100 text-green-800";
    case "Em piloto":
      return "bg-amber-100 text-amber-800";
    case "Em análise":
      return "bg-blue-100 text-blue-800";
    case "Em implantação":
      return "bg-orange-100 text-orange-800";
    case "Descontinuada":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}