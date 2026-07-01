import crypto from "crypto";
import { prisma } from "./db.server";
import { sendMail } from "./email.server";

const PASSWORD_RESET_TTL_MINUTES = 60;

function getPublicAppUrl() {
  return process.env.PUBLIC_APP_URL ?? "http://localhost:8080";
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildResetEmail({
  resetUrl,
}: {
  resetUrl: string;
}) {
  const subject = "Redefinição de senha — Portal TE";

  const text = [
    "Olá,",
    "",
    "Recebemos uma solicitação para redefinir sua senha no Portal TE.",
    "",
    `Acesse o link abaixo para criar uma nova senha:`,
    resetUrl,
    "",
    "Este link expira em 60 minutos.",
    "",
    "Se você não solicitou essa alteração, ignore este e-mail.",
    "",
    "Portal TE",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Redefinição de senha — Portal TE</h2>
      <p>Recebemos uma solicitação para redefinir sua senha no Portal TE.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block; padding:10px 16px; background:#f97316; color:white; text-decoration:none; border-radius:6px;">
          Redefinir senha
        </a>
      </p>
      <p>Este link expira em <strong>60 minutos</strong>.</p>
      <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
      <p>Portal TE</p>
    </div>
  `;

  return { subject, text, html };
}

export async function createPasswordResetForEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  // Não revelar se o e-mail existe ou não.
  if (!user) {
    return { ok: true };
  }

  const plainToken = crypto.randomBytes(48).toString("base64url");
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = `${getPublicAppUrl().replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(
    plainToken,
  )}`;

  const emailContent = buildResetEmail({ resetUrl });

  await sendMail({
    to: user.email,
    ...emailContent,
  });

  return { ok: true };
}

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
}): Promise<void> {
  const tokenHash = hashToken(input.token);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!row) {
    throw new Error("Link de redefinição inválido ou expirado.");
  }

  if (row.usedAt) {
    throw new Error("Link de redefinição já utilizado.");
  }

  if (row.expiresAt < new Date()) {
    throw new Error("Link de redefinição expirado.");
  }

  const { validatePasswordPolicy } = await import("./auth-policy.server");
  validatePasswordPolicy(input.password);

  const { hashPassword, revokeAllUserTokens } = await import("./auth.server");
  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await revokeAllUserTokens(row.userId);

}