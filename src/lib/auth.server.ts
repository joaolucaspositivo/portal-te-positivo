// Helpers de auth caseiro: bcrypt + JWT. Apenas server-side.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "./db.server";
import type { AppRole } from "@prisma/client";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

function getSecrets() {
  const access = process.env.JWT_SECRET;
  const refresh = process.env.JWT_REFRESH_SECRET;
  if (!access || !refresh) {
    throw new Error("JWT_SECRET e JWT_REFRESH_SECRET precisam estar definidos no .env");
  }
  return { access, refresh };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type AccessTokenPayload = {
  sub: string; // user id
  email: string;
  roles: AppRole[];
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getSecrets().access, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getSecrets().access) as AccessTokenPayload;
}

/** Gera refresh token opaco, guarda hash no banco, retorna o token plain pro cliente. */
export async function issueRefreshToken(userId: string): Promise<string> {
  const plain = crypto.randomBytes(48).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(plain).digest("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
  return plain;
}

/** Valida refresh token; se válido, revoga o antigo e emite um novo (rotação). */
export async function rotateRefreshToken(plain: string): Promise<{ userId: string; newToken: string } | null> {
  const tokenHash = crypto.createHash("sha256").update(plain).digest("hex");
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt < new Date()) return null;

  await prisma.refreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
  const newToken = await issueRefreshToken(row.userId);
  return { userId: row.userId, newToken };
}

export async function revokeRefreshToken(plain: string): Promise<void> {
  const tokenHash = crypto.createHash("sha256").update(plain).digest("hex");
  await prisma.refreshToken
    .update({ where: { tokenHash }, data: { revokedAt: new Date() } })
    .catch(() => {});
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function loadUserWithRoles(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true, profile: true },
  });
}

export function hasRole(roles: AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}