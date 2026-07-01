import type { ProfileStatus } from "@prisma/client";

export const PASSWORD_POLICY_MESSAGE =
  "A senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula, letra minúscula e número.";

export function validatePasswordPolicy(password: string): void {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }
}

export function assertProfileCanAccess(status: ProfileStatus | null | undefined): void {
  if (status === "ativo") return;

  if (status === "bloqueado") {
    throw new Error("Seu acesso está bloqueado. Entre em contato com a equipe da TE.");
  }

  throw new Error("Seu cadastro ainda está pendente de aprovação pela equipe da TE.");
}

export function canProfileAccess(status: ProfileStatus | null | undefined): boolean {
  return status === "ativo";
}