import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.local";

const AdminOnly = createServerFn;

function assertAdmin(ctx: { roles: string[] }) {
  if (!ctx.roles.includes("admin")) throw new Error("Forbidden");
}

export const listUsers = AdminOnly({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeUser } = await import("./prisma-helpers.server");
    const users = await prisma.user.findMany({
      include: { profile: true, roles: true },
      orderBy: { email: "asc" },
      take: 500,
    });
    return users.map(serializeUser);
  });

const StatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["pendente", "ativo", "bloqueado"]),
});

export const setUserStatus = AdminOnly({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => StatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    await prisma.profile.update({
      where: { id: data.userId },
      data: { status: data.status },
    });
    return { ok: true };
  });

const RolesSchema = z.object({
  userId: z.string().uuid(),
  roles: z.array(z.enum(["admin", "equipe_te", "editor", "usuario"])).min(1),
});

export const setUserRoles = AdminOnly({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => RolesSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context);
    if (data.userId === context.userId && !data.roles.includes("admin")) {
      throw new Error("Você não pode remover seu próprio papel de admin.");
    }
    const { prisma } = await import("./db.server");
    const unique = Array.from(new Set(data.roles));
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: data.userId } }),
      prisma.userRole.createMany({
        data: unique.map((role) => ({ userId: data.userId, role })),
      }),
    ]);
    return { ok: true };
  });

const ProfileSchema = z.object({
  userId: z.string().uuid(),
  nome_completo: z.string().trim().max(160).optional().nullable(),
  cargo: z.string().trim().max(160).optional().nullable(),
  unidade: z.string().trim().max(160).optional().nullable(),
  telefone: z.string().trim().max(40).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
});

export const adminUpdateProfile = AdminOnly({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    await prisma.profile.update({
      where: { id: data.userId },
      data: {
        nomeCompleto: data.nome_completo ?? null,
        cargo: data.cargo ?? null,
        unidade: data.unidade ?? null,
        telefone: data.telefone ?? null,
        bio: data.bio ?? null,
      },
    });
    return { ok: true };
  });

const ResetSchema = z.object({ email: z.string().email() });

/** Admin dispara reset — gera token, salva e envia por SMTP (ou loga em dev). */
export const sendPasswordReset = AdminOnly({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ResetSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { issuePasswordResetToken } = await import("./password-reset.server");
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error("Usuário não encontrado");
    const token = await issuePasswordResetToken(user.id);
    const url = `${process.env.PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    const { sendMail } = await import("./mail.server");
    await sendMail({
      to: data.email,
      subject: "Redefinição de senha — Portal TE",
      text: `Um administrador solicitou a redefinição da sua senha. Acesse: ${url}\n\nO link expira em 1 hora.`,
    });
    return { ok: true };
  });

const DeleteSchema = z.object({ userId: z.string().uuid() });

export const deleteUser = AdminOnly({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => DeleteSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Você não pode excluir a si mesmo.");
    const { prisma } = await import("./db.server");
    await prisma.user.delete({ where: { id: data.userId } });
    return { ok: true };
  });