import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const UnidadeInput = z.object({
  nome: z.string().trim().min(1).max(160),
  sigla: z.string().trim().min(1).max(40),
  status: z.enum(["ativa", "inativa"]).default("ativa"),
  cep: z.string().trim().max(20).nullable().optional(),
  logradouro: z.string().trim().max(200).nullable().optional(),
  numero: z.string().trim().max(20).nullable().optional(),
  complemento: z.string().trim().max(120).nullable().optional(),
  bairro: z.string().trim().max(120).nullable().optional(),
  cidade: z.string().trim().max(120).nullable().optional(),
  estado: z.string().trim().max(2).nullable().optional(),
  telefone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().email().max(160).nullable().optional().or(z.literal("")),
  responsavel_nome: z.string().trim().max(160).nullable().optional(),
  responsavel_cargo: z.string().trim().max(160).nullable().optional(),
});

export const listUnidades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("unidades")
      .select("*")
      .order("nome");
    if (error) throw new Error(error.message);

    const ids = (data ?? []).map((u: any) => u.id);
    if (ids.length === 0) return (data ?? []).map((u: any) => ({ ...u, usuarios_count: 0 }));

    const { data: vinculos } = await supabaseAdmin
      .from("usuario_unidades")
      .select("unidade_id");
    const counts = new Map<string, number>();
    (vinculos ?? []).forEach((v: any) => {
      counts.set(v.unidade_id, (counts.get(v.unidade_id) ?? 0) + 1);
    });
    return (data ?? []).map((u: any) => ({ ...u, usuarios_count: counts.get(u.id) ?? 0 }));
  });

export const getUnidade = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error } = await supabaseAdmin
      .from("unidades").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return u;
  });

export const createUnidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UnidadeInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = { ...data, email: data.email === "" ? null : data.email };
    const { data: row, error } = await context.supabase
      .from("unidades").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateUnidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    UnidadeInput.partial().extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data as any;
    if (rest.email === "") rest.email = null;
    const { error } = await context.supabase
      .from("unidades").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUnidadeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["ativa", "inativa"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("unidades").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUnidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const [{ count: vinc }, { count: solic }] = await Promise.all([
      context.supabase.from("usuario_unidades").select("user_id", { count: "exact", head: true }).eq("unidade_id", data.id),
      context.supabase.from("solicitacoes").select("id", { count: "exact", head: true }).eq("unidade_id", data.id),
    ]);
    if ((vinc ?? 0) > 0 || (solic ?? 0) > 0) {
      throw new Error("Esta unidade possui usuários vinculados ou solicitações. Desative-a em vez de excluir.");
    }
    const { error } = await context.supabase.from("unidades").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listUsuariosDaUnidade = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ unidadeId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: vinculos, error } = await supabaseAdmin
      .from("usuario_unidades")
      .select("user_id, principal, created_at")
      .eq("unidade_id", data.unidadeId);
    if (error) throw new Error(error.message);
    const ids = (vinculos ?? []).map((v: any) => v.user_id);
    if (ids.length === 0) return [];
    const { data: profiles } = await supabaseAdmin.from("profiles").select("*").in("id", ids);
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailMap = new Map<string, string>((users?.users ?? []).map((u: any) => [u.id, u.email ?? ""]));
    const pMap = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
    return (vinculos ?? []).map((v: any) => ({
      user_id: v.user_id,
      principal: v.principal,
      email: emailMap.get(v.user_id) ?? "",
      profile: pMap.get(v.user_id) ?? null,
    }));
  });

export const listMinhasUnidades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("usuario_unidades")
      .select("unidade_id, principal, unidades(id, nome, sigla, status)")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? [])
      .filter((v: any) => v.unidades && v.unidades.status === "ativa")
      .map((v: any) => ({
        unidade_id: v.unidade_id,
        principal: v.principal,
        nome: v.unidades.nome,
        sigla: v.unidades.sigla,
      }));
  });

export const setUserUnidades = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      userId: z.string().uuid(),
      unidadeIds: z.array(z.string().uuid()),
      principalId: z.string().uuid().nullable().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: delErr } = await supabaseAdmin
      .from("usuario_unidades").delete().eq("user_id", data.userId);
    if (delErr) throw new Error(delErr.message);
    if (data.unidadeIds.length === 0) return { ok: true };
    const rows = Array.from(new Set(data.unidadeIds)).map((unidade_id) => ({
      user_id: data.userId,
      unidade_id,
      principal: data.principalId === unidade_id,
    }));
    const { error: insErr } = await supabaseAdmin.from("usuario_unidades").insert(rows);
    if (insErr) throw new Error(insErr.message);
    return { ok: true };
  });

export const vincularUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      unidadeId: z.string().uuid(),
      userId: z.string().uuid(),
      principal: z.boolean().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.principal) {
      await supabaseAdmin.from("usuario_unidades")
        .update({ principal: false }).eq("user_id", data.userId);
    }
    const { error } = await supabaseAdmin.from("usuario_unidades").upsert({
      user_id: data.userId,
      unidade_id: data.unidadeId,
      principal: data.principal ?? false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const desvincularUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ unidadeId: z.string().uuid(), userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("usuario_unidades").delete()
      .eq("user_id", data.userId).eq("unidade_id", data.unidadeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const definirUnidadePrincipal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ unidadeId: z.string().uuid(), userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("usuario_unidades")
      .update({ principal: false }).eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("usuario_unidades")
      .update({ principal: true })
      .eq("user_id", data.userId).eq("unidade_id", data.unidadeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });