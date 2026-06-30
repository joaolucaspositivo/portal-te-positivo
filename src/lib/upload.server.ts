import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { verifyAccessToken } from "./auth.server";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
  ["application/pdf", "pdf"],
]);

function getUploadRoot() {
  const uploadDir = process.env.UPLOAD_DIR;

  if (!uploadDir) {
    throw new Error("UPLOAD_DIR precisa estar definido no .env");
  }

  return path.resolve(uploadDir);
}

function sanitizeFolder(folder: string | null) {
  const fallback = "geral";
  const normalized = (folder ?? fallback)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/\.\./g, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");

  return normalized || fallback;
}

function getRelativePublicPath(folder: string, fileName: string) {
  return `/uploads/${folder}/${fileName}`.replace(/\/+/g, "/");
}

function resolveStoredUploadPath(relativePath: string) {
  const clean = relativePath
    .replace(/^\/?uploads\/?/, "")
    .replace(/^\/+/, "")
    .replace(/\.\./g, "");

  const root = getUploadRoot();
  const absolutePath = path.resolve(root, clean);

  if (!absolutePath.startsWith(root)) {
    throw new Error("Caminho de arquivo inválido.");
  }

  return absolutePath;
}

function getContentTypeFromPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".pdf") return "application/pdf";

  return "application/octet-stream";
}

export function assertCanUpload(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: sem token");
  }

  const token = authHeader.slice("Bearer ".length);
  const payload = verifyAccessToken(token);

  const allowed = payload.roles.some((role) => ["admin", "equipe_te", "editor"].includes(role));

  if (!allowed) {
    throw new Error("Forbidden");
  }

  return payload;
}

export async function saveUploadFromRequest(request: Request) {
  assertCanUpload(request);

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = sanitizeFolder(String(formData.get("folder") ?? "geral"));

  if (!(file instanceof File)) {
    throw new Error("Arquivo não enviado.");
  }

  if (file.size <= 0) {
    throw new Error("Arquivo vazio.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Arquivo maior que 5MB.");
  }

  const ext = ALLOWED_MIME_TYPES.get(file.type);

  if (!ext) {
    throw new Error("Tipo de arquivo não permitido.");
  }

  const uploadRoot = getUploadRoot();
  const targetDir = path.join(uploadRoot, folder);

  await mkdir(targetDir, { recursive: true });

  const fileName = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${ext}`;
  const absolutePath = path.join(targetDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return {
    ok: true,
    path: getRelativePublicPath(folder, fileName),
    fileName,
    contentType: file.type,
    size: file.size,
  };
}

export async function readUploadResponse(publicPath: string) {
  const absolutePath = resolveStoredUploadPath(publicPath);
  const body = await readFile(absolutePath);
  const contentType = getContentTypeFromPath(absolutePath);

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}