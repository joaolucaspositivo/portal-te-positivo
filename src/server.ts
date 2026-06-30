import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }

  return serverEntryPromise;
}

async function handleUploadRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);

  if (url.pathname === "/api/uploads") {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const { saveUploadFromRequest } = await import("./lib/upload.server");
      const result = await saveUploadFromRequest(request);

      return Response.json(result);
    } catch (error: any) {
      console.error(error);

      return Response.json(
        {
          ok: false,
          message: error?.message ?? "Não foi possível enviar o arquivo.",
        },
        {
          status:
            error?.message?.startsWith("Unauthorized") || error?.message === "Forbidden"
              ? 401
              : 400,
        },
      );
    }
  }

  if (url.pathname.startsWith("/uploads/")) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const { readUploadResponse } = await import("./lib/upload.server");
      return await readUploadResponse(url.pathname);
    } catch {
      return new Response("Arquivo não encontrado.", { status: 404 });
    }
  }

  return null;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();

  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));

  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const uploadResponse = await handleUploadRequest(request);

      if (uploadResponse) {
        return uploadResponse;
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);

      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);

      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};