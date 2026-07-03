export function normalizeSolicitacaoStatus(status: string | null | undefined): string {
  const value = status?.trim();

  return value || "Recebida";
}

export function normalizeSolicitacaoUrgencia(urgencia: string | null | undefined): string {
  const value = urgencia?.trim();

  return value || "Média";
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