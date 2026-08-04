import { createFileRoute } from "@tanstack/react-router";
import type { AppRole } from "@prisma/client";


export const Route = createFileRoute("/api/auth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        if (!code) return new Response("Missing code", { status: 400 });

        const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
        const base = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
        const redirectUri = `${base}/api/auth/google/callback`;
        if (!clientId || !clientSecret) return new Response("Google OAuth não configurado", { status: 501 });

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code, client_id: clientId, client_secret: clientSecret,
            redirect_uri: redirectUri, grant_type: "authorization_code",
          }),
        });
        if (!tokenRes.ok) return new Response("Falha ao trocar token", { status: 400 });
        const tokens = (await tokenRes.json()) as { access_token: string };

        const profRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { authorization: `Bearer ${tokens.access_token}` },
        });
        if (!profRes.ok) return new Response("Falha ao ler perfil", { status: 400 });
        const profile = (await profRes.json()) as { sub: string; email: string; name?: string; picture?: string };
        if (!profile.email) return new Response("Email obrigatório", { status: 400 });

        const { prisma } = await import("@/lib/db.server");
        const { signAccessToken, issueRefreshToken } = await import("@/lib/auth.server");

        let user = await prisma.user.findFirst({
          where: { OR: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }] },
          include: { roles: true },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.email.toLowerCase(),
              googleId: profile.sub,
              emailVerifiedAt: new Date(),
              profile: { create: { nomeCompleto: profile.name ?? profile.email, status: "pendente" } },
              roles: { create: { role: "usuario" } },
            },
            include: { roles: true },
          });
          if (user.email === "tecipp@colegiopositivo.com.br") {
            await prisma.userRole.upsert({
              where: { userId_role: { userId: user.id, role: "admin" } },
              create: { userId: user.id, role: "admin" },
              update: {},
            });
            await prisma.profile.update({ where: { id: user.id }, data: { status: "ativo" } });
          }
        } else if (!user.googleId) {
          await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.sub } });
        }

        const roles = user.roles.map((r) => r.role) as AppRole[];
        const accessToken = signAccessToken({ sub: user.id, email: user.email, roles });
        const refreshToken = await issueRefreshToken(user.id);

        const redirect = new URL("/auth/callback", base);
        redirect.hash = new URLSearchParams({ access_token: accessToken, refresh_token: refreshToken }).toString();
        return Response.redirect(redirect.toString(), 302);
      },
    },
  },
});