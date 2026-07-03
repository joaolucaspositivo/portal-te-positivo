import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware.local";
import { z } from "zod";

function assertAdmin(ctx: { roles?: string[] }) {
  if (!ctx.roles?.includes("admin")) {
    throw new Error("Forbidden");
  }
}

const TestEmailSchema = z.object({
  to: z.string().trim().email(),
});

export const getEmailStatusAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertAdmin(context as any);

    const { getEmailConfigStatus } = await import("./email.server");

    return getEmailConfigStatus();
  });

export const sendTestEmailAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => TestEmailSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertAdmin(context as any);

    const { sendMail, baseEmailTemplate, getEmailConfigStatus } = await import("./email.server");

    const status = getEmailConfigStatus();

    if (!status.configured) {
      return {
        skipped: true,
        configured: false,
        reason: "SMTP não configurado.",
      };
    }

    const publicUrl = process.env.PUBLIC_APP_URL ?? "http://localhost:8080";

    const html = baseEmailTemplate({
      title: "Teste de e-mail do Portal TE",
      intro: "Este é um envio de teste da configuração SMTP.",
      content: `
        <p>Se você recebeu este e-mail, a configuração SMTP do Portal TE está funcionando.</p>
        <p><strong>Host:</strong> ${status.host}</p>
        <p><strong>Porta:</strong> ${status.port}</p>
        <p><strong>Remetente:</strong> ${status.from}</p>
      `,
      actionLabel: "Abrir Portal TE",
      actionUrl: publicUrl,
    });

    const result = await sendMail({
      to: data.to,
      subject: "Teste de e-mail — Portal TE",
      html,
      text: "Teste de e-mail do Portal TE.",
    });

    return {
      skipped: false,
      configured: true,
      messageId: result.messageId,
    };
  });