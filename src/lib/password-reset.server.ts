import crypto from "crypto";
import { prisma } from "./db.server";
import { hashPassword } from "./auth.server";

const TTL_MINUTES = 60;

export async function issuePasswordResetToken(userId: string): Promise<string> {
  const plain = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(plain).digest("hex");
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  return plain;
}

export async function consumePasswordResetToken(plain: string, newPassword: string) {
  const tokenHash = crypto.createHash("sha256").update(plain).digest("hex");
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new Error("Token inválido ou expirado.");
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}