import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async () => {
        const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
        if (!clientId) return new Response("Google OAuth não configurado", { status: 501 });
        const base = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
        const redirectUri = `${base}/api/auth/google/callback`;
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "openid email profile",
          access_type: "online",
          prompt: "select_account",
        });
        return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
      },
    },
  },
});