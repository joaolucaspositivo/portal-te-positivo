// Unidades escolares + vínculo de usuários (Prisma).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.local";
import { UnidadeInput } from "./unidades-schemas";

export const listUnidades = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeUnidade } = await import("./prisma-helpers.server");
    const rows = await prisma.unidade.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { usuarios: true } } },
    });
    return rows.map((u) => ({ ...serializeUnidade(u), usuarios_count: u._count.usuarios }));
  });

export const getUnidade = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeUnidade } = await import("./prisma-helpers.server");
    const row = await prisma.unidade.findUnique({ where: { id: data.id } });
    return row ? serializeUnidade(row) : null;
  });

export const createUnidade = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => UnidadeInput.parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeUnidade } = await import("./prisma-helpers.server");
    const row = await prisma.unidade.create({
      data: {
        nome: data.nome,
        sigla: data.sigla,
        status: data.status ?? "ativa",
        cep: data.cep ?? null,
        logradouro: data.logradouro ?? null,
        numero: data.numero ?? null,
        complemento: data.complemento ?? null,
        bairro: data.bairro ?? null,
        cidade: data.cidade ?? null,
        estado: data.estado ?? null,
        telefone: data.telefone ?? null,
        email: data.email ? data.email : null,
        responsavelNome: data.responsavel_nome ?? null,
        responsavelCargo: data.responsavel_cargo ?? null,
      },
    });
    return serializeUnidade(row);
  });

export const updateUnidade = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    UnidadeInput.partial().extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { id, ...rest } = data;
    await prisma.unidade.update({
      where: { id },
      data: {
        ...(rest.nome !== undefined ? { nome: rest.nome } : {}),
        ...(rest.sigla !== undefined ? { sigla: rest.sigla } : {}),
        ...(rest.status !== undefined ? { status: rest.status } : {}),
        ...(rest.cep !== undefined ? { cep: rest.cep ?? null } : {}),
        ...(rest.logradouro !== undefined ? { logradouro: rest.logradouro ?? null } : {}),
        ...(rest.numero !== undefined ? { numero: rest.numero ?? null } : {}),
        ...(rest.complemento !== undefined ? { complemento: rest.complemento ?? null } : {}),
        ...(rest.bairro !== undefined ? { bairro: rest.bairro ?? null } : {}),
        ...(rest.cidade !== undefined ? { cidade: rest.cidade ?? null } : {}),
        ...(rest.estado !== undefined ? { estado: rest.estado ?? null } : {}),
        ...(rest.telefone !== undefined ? { telefone: rest.telefone ?? null } : {}),
        ...(rest.email !== undefined ? { email: rest.email ? rest.email : null } : {}),
        ...(rest.responsavel_nome !== undefined ? { responsavelNome: rest.responsavel_nome ?? null } : {}),
        ...(rest.responsavel_cargo !== undefined ? { responsavelCargo: rest.responsavel_cargo ?? null } : {}),
      },
    });
    return { ok: true };
  });

export const setUnidadeStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["ativa", "inativa"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    await prisma.unidade.update({ where: { id: data.id }, data: { status: data.status } });
    return { ok: true };
  });

export const deleteUnidade = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const [vinc, solic] = await Promise.all([
      prisma.usuarioUnidade.count({ where: { unidadeId: data.id } }),
      prisma.solicitacao.count({ where: { unidadeId: data.id } }),
    ]);
    if (vinc > 0 || solic > 0) {
      throw new Error("Esta unidade possui usuários vinculados ou solicitações. Desative-a em vez de excluir.");
    }
    await prisma.unidade.delete({ where: { id: data.id } });
    return { ok: true };
  });

export const listUsuariosDaUnidade = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ unidadeId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const { serializeProfile } = await import("./prisma-helpers.server");
    const vinculos = await prisma.usuarioUnidade.findMany({
      where: { unidadeId: data.unidadeId },
      include: { user: { include: { profile: true } } },
    });
    return vinculos.map((v) => ({
      user_id: v.userId,
      principal: v.principal,
      email: v.user.email,
      profile: serializeProfile(v.user.profile),
    }));
  });

/** Unidades ativas do usuário logado (para o formulário público). */
export const listMinhasUnidades = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { prisma } = await import("./db.server");
    const vinculos = await prisma.usuarioUnidade.findMany({
      where: { userId: context.userId, unidade: { status: "ativa" } },
      include: { unidade: true },
    });
    return vinculos.map((v) => ({
      unidade_id: v.unidadeId,
      principal: v.principal,
      nome: v.unidade.nome,
      sigla: v.unidade.sigla,
    }));
  });

export const setUserUnidades = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z.object({
      userId: z.string().uuid(),
      unidadeIds: z.array(z.string().uuid()),
      principalId: z.string().uuid().nullable().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    const unique = Array.from(new Set(data.unidadeIds));
    await prisma.$transaction([
      prisma.usuarioUnidade.deleteMany({ where: { userId: data.userId } }),
      ...(unique.length
        ? [
            prisma.usuarioUnidade.createMany({
              data: unique.map((unidadeId) => ({
                userId: data.userId,
                unidadeId,
                principal: data.principalId === unidadeId,
              })),
            }),
          ]
        : []),
    ]);
    return { ok: true };
  });

export const vincularUsuario = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z.object({
      unidadeId: z.string().uuid(),
      userId: z.string().uuid(),
      principal: z.boolean().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    if (data.principal) {
      await prisma.usuarioUnidade.updateMany({
        where: { userId: data.userId },
        data: { principal: false },
      });
    }
    await prisma.usuarioUnidade.upsert({
      where: { userId_unidadeId: { userId: data.userId, unidadeId: data.unidadeId } },
      create: { userId: data.userId, unidadeId: data.unidadeId, principal: data.principal ?? false },
      update: { principal: data.principal ?? false },
    });
    return { ok: true };
  });

export const desvincularUsuario = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z.object({ unidadeId: z.string().uuid(), userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    await prisma.usuarioUnidade.deleteMany({
      where: { userId: data.userId, unidadeId: data.unidadeId },
    });
    return { ok: true };
  });

export const definirUnidadePrincipal = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z.object({ unidadeId: z.string().uuid(), userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./authz.server");
    assertAdmin(context);
    const { prisma } = await import("./db.server");
    await prisma.$transaction([
      prisma.usuarioUnidade.updateMany({ where: { userId: data.userId }, data: { principal: false } }),
      prisma.usuarioUnidade.updateMany({
        where: { userId: data.userId, unidadeId: data.unidadeId },
        data: { principal: true },
      }),
    ]);
    return { ok: true };
  });
