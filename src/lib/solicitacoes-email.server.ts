import {
  baseEmailTemplate,
  getEmailConfigStatus,
  sendMail,
} from "./email.server";

type SolicitacaoEmailData = {
  id: string;
  titulo: string;
  nome_solicitante: string;
  email_solicitante: string;
  unidade: string;
  tipo_solicitacao: string;
  status: string;
  urgencia: string;
  descricao?: string | null;
};

function getPublicAppUrl() {
  return (process.env.PUBLIC_APP_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

function getNotificationEmails() {
  return (process.env.PORTAL_TE_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

async function safeSendMail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}) {
  const status = getEmailConfigStatus();

  if (!status.configured) {
    console.log("[email] SMTP não configurado. Notificação ignorada.", {
      to: input.to,
      subject: input.subject,
    });

    return;
  }

  try {
    await sendMail({
      ...input,
      to: Array.isArray(input.to) ? input.to.join(",") : input.to,
    });
  } catch (error) {
    console.error("[email] Falha ao enviar notificação.", {
      to: input.to,
      subject: input.subject,
      error,
    });
  }
}

export async function notifySolicitacaoCriadaSolicitante(s: SolicitacaoEmailData) {
  const html = baseEmailTemplate({
    title: "Solicitação recebida — Portal TE",
    intro: `Olá, ${s.nome_solicitante}. Recebemos sua solicitação no Portal TE.`,
    content: `
      <p><strong>Título:</strong> ${s.titulo}</p>
      <p><strong>Tipo:</strong> ${s.tipo_solicitacao}</p>
      <p><strong>Unidade:</strong> ${s.unidade}</p>
      <p><strong>Status inicial:</strong> ${s.status}</p>
      <p>A equipe de Tecnologia Educacional fará a análise da demanda e seguirá o fluxo interno de priorização.</p>
    `,
  });

  await safeSendMail({
    to: s.email_solicitante,
    subject: `Solicitação recebida — ${s.titulo}`,
    html,
    text: [
      `Olá, ${s.nome_solicitante}.`,
      "",
      "Recebemos sua solicitação no Portal TE.",
      "",
      `Título: ${s.titulo}`,
      `Tipo: ${s.tipo_solicitacao}`,
      `Unidade: ${s.unidade}`,
      `Status inicial: ${s.status}`,
      "",
      "A equipe de Tecnologia Educacional fará a análise da demanda.",
    ].join("\n"),
  });
}

export async function notifySolicitacaoCriadaEquipe(s: SolicitacaoEmailData) {
  const recipients = getNotificationEmails();

  if (recipients.length === 0) {
    console.log("[email] PORTAL_TE_NOTIFICATION_EMAILS não configurado. Notificação da equipe ignorada.");
    return;
  }

  const url = `${getPublicAppUrl()}/area-te/solicitacoes/${s.id}`;

  const html = baseEmailTemplate({
    title: "Nova solicitação aberta — Portal TE",
    intro: "Uma nova solicitação foi registrada no Portal TE.",
    content: `
      <p><strong>Título:</strong> ${s.titulo}</p>
      <p><strong>Solicitante:</strong> ${s.nome_solicitante} (${s.email_solicitante})</p>
      <p><strong>Tipo:</strong> ${s.tipo_solicitacao}</p>
      <p><strong>Unidade:</strong> ${s.unidade}</p>
      <p><strong>Urgência:</strong> ${s.urgencia}</p>
      <p><strong>Status:</strong> ${s.status}</p>
      ${
        s.descricao
          ? `<p><strong>Descrição:</strong><br>${s.descricao.replace(/\n/g, "<br>")}</p>`
          : ""
      }
    `,
    actionLabel: "Abrir solicitação",
    actionUrl: url,
  });

  await safeSendMail({
    to: recipients,
    subject: `Nova solicitação — ${s.titulo}`,
    html,
    text: [
      "Uma nova solicitação foi registrada no Portal TE.",
      "",
      `Título: ${s.titulo}`,
      `Solicitante: ${s.nome_solicitante} (${s.email_solicitante})`,
      `Tipo: ${s.tipo_solicitacao}`,
      `Unidade: ${s.unidade}`,
      `Urgência: ${s.urgencia}`,
      `Status: ${s.status}`,
      "",
      url,
    ].join("\n"),
  });
}

export async function notifySolicitacaoStatusAlterado(input: {
  solicitacao: SolicitacaoEmailData;
  statusAnterior: string;
  statusNovo: string;
}) {
  const { solicitacao, statusAnterior, statusNovo } = input;

  if (statusAnterior === statusNovo) {
    return;
  }

  const html = baseEmailTemplate({
    title: "Status da solicitação atualizado — Portal TE",
    intro: `Olá, ${solicitacao.nome_solicitante}. O status da sua solicitação foi atualizado.`,
    content: `
      <p><strong>Título:</strong> ${solicitacao.titulo}</p>
      <p><strong>Status anterior:</strong> ${statusAnterior}</p>
      <p><strong>Novo status:</strong> ${statusNovo}</p>
      <p>Acompanhe as próximas orientações da equipe de Tecnologia Educacional.</p>
    `,
  });

  await safeSendMail({
    to: solicitacao.email_solicitante,
    subject: `Status atualizado — ${solicitacao.titulo}`,
    html,
    text: [
      `Olá, ${solicitacao.nome_solicitante}.`,
      "",
      "O status da sua solicitação foi atualizado.",
      "",
      `Título: ${solicitacao.titulo}`,
      `Status anterior: ${statusAnterior}`,
      `Novo status: ${statusNovo}`,
    ].join("\n"),
  });
}