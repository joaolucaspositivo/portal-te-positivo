// Storage local em disco. Bucket = subdiretório de UPLOAD_DIR.
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const BUCKETS = { media: "portal-media", avatars: "portal-avatars" } as const;
export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

function root() {
  return process.env.UPLOAD_DIR ?? "/var/lib/portal-te/uploads";
}

function assertBucket(name: string): asserts name is BucketName {
  if (name !== "portal-media" && name !== "portal-avatars") {
    throw new Error(`Bucket inválido: ${name}`);
  }
}

function safeName(original: string): string {
  return original.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export async function saveFile(bucket: string, file: File): Promise<{ path: string; url: string }> {
  assertBucket(bucket);
  const dir = path.join(root(), bucket);
  await fs.mkdir(dir, { recursive: true });
  const id = crypto.randomBytes(12).toString("hex");
  const name = `${id}-${safeName(file.name || "file")}`;
  const fullPath = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buf);
  return { path: `${bucket}/${name}`, url: `/api/files/${bucket}/${name}` };
}

export async function readFile(bucket: string, name: string) {
  assertBucket(bucket);
  const safe = path.basename(name);
  const fullPath = path.join(root(), bucket, safe);
  const buf = await fs.readFile(fullPath);
  return { buf, name: safe };
}

export async function deleteFile(bucket: string, name: string) {
  assertBucket(bucket);
  const safe = path.basename(name);
  await fs.unlink(path.join(root(), bucket, safe)).catch(() => {});
}

export function guessContentType(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const map: Record<string, string> = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}