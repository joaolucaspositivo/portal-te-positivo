import { createFileRoute } from "@tanstack/react-router";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/png","image/jpeg","image/gif","image/webp","image/svg+xml","application/pdf"];

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const { verifyAccessToken } = await import("@/lib/auth.server");
        try { verifyAccessToken(authHeader.slice("Bearer ".length)); }
        catch { return new Response("Unauthorized", { status: 401 }); }

        const form = await request.formData();
        const bucket = String(form.get("bucket") ?? "");
        const file = form.get("file");
        if (!(file instanceof File)) return new Response("Missing file", { status: 400 });
        if (file.size > MAX_BYTES) return new Response("File too large", { status: 413 });
        if (file.type && !ALLOWED.includes(file.type)) return new Response("Unsupported type", { status: 415 });
        const { saveFile } = await import("@/lib/storage.server");
        const result = await saveFile(bucket, file);
        return Response.json(result);
      },
    },
  },
});