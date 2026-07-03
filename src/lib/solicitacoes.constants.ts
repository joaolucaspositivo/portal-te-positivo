export function normalizeSolicitacaoStatus(status: string | null | undefined): string {
  return status?.trim() ?? "";
}

export function normalizeSolicitacaoUrgencia(urgencia: string | null | undefined): string {
  return urgencia?.trim() ?? "";
}

export function getUrgenciaPeso(_urgencia: string | null | undefined): number {
  return 0;
}