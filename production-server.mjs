import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { Readable } from "node:stream";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8080);

const clientDir = join(process.cwd(), "dist", "client");
const serverModule = await import("./dist/server/server.js");
const app = serverModule.default ?? serverModule;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function getContentType(filePath) {
  return contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
}

function safeClientPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const cleaned = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(clientDir, cleaned);
}

function sendNodeResponse(res, response) {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  Readable.fromWeb(response.body).pipe(res);
}

async function serveStatic(req, res, pathname) {
  if (pathname === "/") return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/uploads/")) return false;

  const filePath = safeClientPath(pathname);

  if (!filePath.startsWith(clientDir)) return false;
  if (!existsSync(filePath)) return false;

  const stat = statSync(filePath);
  if (!stat.isFile()) return false;

  res.statusCode = 200;
  res.setHeader("content-type", getContentType(filePath));
  res.setHeader("cache-control", "public, max-age=31536000, immutable");

  createReadStream(filePath).pipe(res);
  return true;
}

async function toRequest(req) {
  const protocol = process.env.PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
  const hostHeader = req.headers.host || `localhost:${port}`;
  const url = `${protocol}://${hostHeader}${req.url || "/"}`;

  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value != null) {
      headers.set(key, value);
    }
  }

  const method = req.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";

  return new Request(url, {
    method,
    headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: hasBody ? "half" : undefined,
  });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `localhost:${port}`}`);

    if (url.pathname === "/api/health") {
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const servedStatic = await serveStatic(req, res, url.pathname);
    if (servedStatic) return;

    const request = await toRequest(req);
    const response = await app.fetch(request, process.env, {});

    sendNodeResponse(res, response);
  } catch (error) {
    console.error(error);

    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Erro interno do servidor.");
  }
});

server.listen(port, host, () => {
  console.log(`Portal TE running at http://${host}:${port}`);
});