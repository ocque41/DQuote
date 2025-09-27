import nodemailer from "nodemailer";

interface SendReceiptEmailOptions {
  recipients: string[];
  orgName: string;
  proposalTitle: string;
  acceptorName: string;
  acceptorEmail: string;
  clientName?: string | null;
  total: number;
  deposit: number;
  currency: string;
  receiptUrl?: string | null;
  pdfAttachment?: { fileName: string; buffer: Buffer } | null;
  baseUrl: string;
}

function resolveEnv(key: string) {
  const value = process.env[key];
  return typeof value === "string" && value.length ? value : null;
}

export async function sendReceiptEmail({
  recipients,
  orgName,
  proposalTitle,
  acceptorName,
  acceptorEmail,
  clientName,
  total,
  deposit,
  currency,
  receiptUrl,
  pdfAttachment,
  baseUrl
}: SendReceiptEmailOptions) {
  const host = resolveEnv("SMTP_HOST");
  const portValue = resolveEnv("SMTP_PORT");
  const user = resolveEnv("SMTP_USER");
  const password = resolveEnv("SMTP_PASSWORD");
  const from = resolveEnv("EMAIL_FROM");

  if (!host || !portValue || !user || !password || !from) {
    throw new Error("SMTP configuration is incomplete — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM");
  }

  const port = Number(portValue);
  if (!Number.isFinite(port)) {
    throw new Error(`Invalid SMTP_PORT: ${portValue}`);
  }

  const uniqueRecipients = Array.from(new Set(recipients.filter((email) => typeof email === "string" && email.includes("@"))));
  if (!uniqueRecipients.length) {
    throw new Error("No valid email recipients provided for receipt delivery");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password }
  });

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const totalFormatted = formatter.format(total);
  const depositFormatted = formatter.format(deposit);
  const absoluteReceiptUrl = receiptUrl ? new URL(receiptUrl, baseUrl).toString() : null;

  const subject = `${orgName} · Receipt for ${proposalTitle}`;
  const greetingName = acceptorName || clientName || "there";

  const lines = [
    `Hi ${greetingName},`,
    "",
    `Thanks for accepting ${proposalTitle} with ${orgName}.`,
    `Total: ${totalFormatted}`,
    `Deposit due: ${depositFormatted}`,
    absoluteReceiptUrl ? `Receipt: ${absoluteReceiptUrl}` : ""
  ].filter(Boolean);

  const textBody = lines.join("\n");

  const htmlBody = `
    <p>Hi ${greetingName},</p>
    <p>Thanks for accepting <strong>${proposalTitle}</strong> with <strong>${orgName}</strong>.</p>
    <table style="border-collapse:collapse;margin:16px 0;min-width:260px">
      <tbody>
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600">Total</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${totalFormatted}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600">Deposit due</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${depositFormatted}</td>
        </tr>
      </tbody>
    </table>
    <p>Accepted by ${acceptorName} (${acceptorEmail}).</p>
    ${
      absoluteReceiptUrl
        ? `<p>You can download the PDF receipt at <a href="${absoluteReceiptUrl}">${absoluteReceiptUrl}</a>.</p>`
        : ""
    }
    <p>We’ll follow up shortly with the next steps.</p>
  `;

  const attachments = pdfAttachment
    ? [
        {
          filename: pdfAttachment.fileName,
          content: pdfAttachment.buffer,
          contentType: "application/pdf"
        }
      ]
    : [];

  await transporter.sendMail({
    from,
    to: uniqueRecipients,
    subject,
    text: textBody,
    html: htmlBody,
    attachments
  });
}
