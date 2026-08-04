import { createStart, createMiddleware } from "@tanstack/react-start";
import { attachLocalAuth } from "@/lib/auth-attacher.local";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, attachLocalAuth],
  requestMiddleware: [errorMiddleware],
}));
