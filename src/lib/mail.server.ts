// Envio de e-mail via SMTP (nodemailer). Se SMTP_HOST vazio, loga no console.
let transporterPromise: Promise<any> | null = null;

async function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporterPromise) {
    transporterPromise = import("nodemailer").then((mod) =>
      mod.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      }),
    );
  }
  return transporterPromise;
}

export async function sendMail(opts: { to: string; subject: string; text: string; html?: string }) {
  const t = await getTransporter();
  if (!t) {
    console.log(`[mail:dev] to=${opts.to} subject="${opts.subject}"\n${opts.text}`);
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM ?? "no-reply@localhost",
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}