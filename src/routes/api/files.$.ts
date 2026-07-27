import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/files/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = params._splat ?? "";
        const [bucket, ...rest] = splat.split("/");
        if (!bucket || rest.length === 0) return new Response("Not found", { status: 404 });
        const name = rest.join("/");
        try {
          const { readFile, guessContentType } = await import("@/lib/storage.server");
          const { buf } = await readFile(bucket, name);
          return new Response(new Uint8Array(buf), {
            headers: { "content-type": guessContentType(name), "cache-control": "public, max-age=3600" },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});