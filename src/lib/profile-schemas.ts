import { z } from "zod";

const t = (max: number) => z.string().trim().max(max).nullable().optional();

export const MyProfileInput = z.object({
  nome_completo: t(160),
  cargo: t(160),
  unidade: t(160),
  telefone: t(40),
  bio: t(2000),
  avatar_url: t(300),
});
