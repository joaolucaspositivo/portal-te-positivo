import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { setAccessToken } from "@/lib/auth-attacher.local";

export const Route = createFileRoute("/auth/callback")({
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const at = params.get("access_token");
    const rt = params.get("refresh_token");
    if (at && rt) {
      setAccessToken(at);
      window.localStorage.setItem("portal-te.refreshToken", rt);
      navigate({ to: "/area-te" });
    } else {
      navigate({ to: "/auth" });
    }
  }, [navigate]);
  return <div className="min-h-screen flex items-center justify-center">Entrando…</div>;
}