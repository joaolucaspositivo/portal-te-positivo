import { createTransport } from "nodemailer";

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP_HOST, SMTP_USER, SMTP_PASS e SMTP_FROM precisam estar definidos no .env");
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    from,
  };
}

export function getEmailConfigStatus() {
  return {
    configured:
      !!process.env.SMTP_HOST &&
      !!process.env.SMTP_USER &&
      !!process.env.SMTP_PASS &&
      !!process.env.SMTP_FROM,
    host: process.env.SMTP_HOST ?? null,
    port: Number(process.env.SMTP_PORT ?? 587),
    from: process.env.SMTP_FROM ?? null,
  };
}

export async function sendMail({ to, subject, html, text }: SendMailInput) {
  const config = getSmtpConfig();

  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
    text,
  });

  return {
    messageId: info.messageId,
  };
}

export function baseEmailTemplate({
  title,
  intro,
  content,
  actionLabel,
  actionUrl,
}: {
  title: string;
  intro?: string;
  content: string;
  actionLabel?: string;
  actionUrl?: string;
}) {
  const button =
    actionLabel && actionUrl
      ? `
        <p style="margin: 24px 0;">
          <a
            href="${actionUrl}"
            style="background:#f97316;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;font-weight:600;"
          >
            ${actionLabel}
          </a>
        </p>
      `
      : "";

  return `
    <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
        <div style="font-size:13px;color:#f97316;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">
          Portal TE
        </div>

        <h1 style="font-size:22px;margin:12px 0;color:#111827;">
          ${title}
        </h1>

        ${
          intro
            ? `<p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 16px;">${intro}</p>`
            : ""
        }

        <div style="color:#374151;font-size:15px;line-height:1.5;">
          ${content}
        </div>

        ${button}

        <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />

        <p style="color:#6b7280;font-size:12px;line-height:1.4;margin:0;">
          Este é um e-mail automático do Portal TE.
        </p>
      </div>
    </div>
  `;
}