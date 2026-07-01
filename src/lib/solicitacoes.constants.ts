export const SOLICITACAO_STATUS = [
  "Recebida",
  "Em análise",
  "Aguardando validação",
  "Em andamento",
  "Concluída",
  "Cancelada",
] as const;

export type SolicitacaoStatus = (typeof SOLICITACAO_STATUS)[number];

export const SOLICITACAO_URGENCIAS = ["Baixa", "Média", "Alta", "Crítica"] as const;

export type SolicitacaoUrgencia = (typeof SOLICITACAO_URGENCIAS)[number];

export const SOLICITACAO_STATUS_ABERTOS: SolicitacaoStatus[] = [
  "Recebida",
  "Em análise",
  "Aguardando validação",
  "Em andamento",
];

export function normalizeSolicitacaoStatus(status: string | null | undefined): SolicitacaoStatus {
  if (SOLICITACAO_STATUS.includes(status as SolicitacaoStatus)) {
    return status as SolicitacaoStatus;
  }

  return "Recebida";
}

export function normalizeSolicitacaoUrgencia(
  urgencia: string | null | undefined,
): SolicitacaoUrgencia {
  if (SOLICITACAO_URGENCIAS.includes(urgencia as SolicitacaoUrgencia)) {
    return urgencia as SolicitacaoUrgencia;
  }

  return "Média";
}

export function getUrgenciaPeso(urgencia: string | null | undefined): number {
  switch (normalizeSolicitacaoUrgencia(urgencia)) {
    case "Crítica":
      return 4;
    case "Alta":
      return 3;
    case "Média":
      return 2;
    case "Baixa":
      return 1;
    default:
      return 0;
  }
}

export function isSolicitacaoAberta(status: string | null | undefined): boolean {
  return SOLICITACAO_STATUS_ABERTOS.includes(normalizeSolicitacaoStatus(status));
}