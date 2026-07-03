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

export function urgencyColor(u: string) {
  switch (u) {
    case "Crítica":
      return "bg-destructive text-destructive-foreground";
    case "Alta":
      return "bg-orange-500 text-white";
    case "Média":
      return "bg-amber-400 text-black";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function statusColor(s: string) {
  switch (s) {
    case "Recebida":
      return "bg-blue-100 text-blue-800";
    case "Em triagem":
      return "bg-indigo-100 text-indigo-800";
    case "Em análise":
      return "bg-amber-100 text-amber-800";
    case "Em execução":
      return "bg-orange-100 text-orange-800";
    case "Aguardando retorno do solicitante":
      return "bg-yellow-100 text-yellow-800";
    case "Concluída":
      return "bg-green-100 text-green-800";
    case "Redirecionada":
      return "bg-purple-100 text-purple-800";
    case "Não aprovada":
      return "bg-red-100 text-red-800";
    case "Ativa":
      return "bg-green-100 text-green-800";
    case "Em piloto":
      return "bg-amber-100 text-amber-800";
    case "Em implantação":
      return "bg-blue-100 text-blue-800";
    case "Descontinuada":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}